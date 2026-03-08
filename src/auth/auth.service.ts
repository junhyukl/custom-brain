import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { randomUUID, randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { JwtService } from '@nestjs/jwt';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type { RegistrationResponseJSON, AuthenticationResponseJSON } from '@simplewebauthn/server';
import { MongoService } from '../mongo/mongo.service';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../common/constants';
import type { User, UserRole, PasskeyCredential, ApiKeyEntry } from '../schemas';

const SALT_ROUNDS = 10;
const RP_NAME = process.env.AUTH_RP_NAME ?? 'Custom Brain';
const RP_ID = process.env.AUTH_RP_ID ?? 'localhost';
const ORIGIN = process.env.AUTH_ORIGIN ?? 'http://localhost:3001';
const API_KEY_PREFIX = 'cb_';

function hashApiKey(plain: string): string {
  return createHash('sha256').update(plain, 'utf8').digest('hex');
}

/** 등록/인증 옵션 생성 시 사용할 임시 challenge 저장 (메모리) */
const pendingChallenges = new Map<string, string>();

@Injectable()
export class AuthService {
  constructor(
    private readonly mongo: MongoService,
    private readonly jwt: JwtService,
  ) {}

  private get col() {
    return this.mongo.getUsersCollection();
  }

  async register(
    email: string,
    password: string,
  ): Promise<{ token: string; user: { id: string; email: string; role: UserRole } }> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.col.findOne({ email: normalized });
    if (existing) throw new ConflictException('이미 등록된 이메일입니다.');
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const isFirstUser = (await this.col.countDocuments()) === 0;
    const role: UserRole = isFirstUser ? 'admin' : 'user';
    const user: User = {
      id,
      email: normalized,
      passwordHash,
      role,
      createdAt: new Date(),
    };
    await this.col.insertOne(user);
    const token = this.jwt.sign(
      { sub: id, email: normalized, role },
      { secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN },
    );
    return { token, user: { id, email: normalized, role } };
  }

  async login(
    email: string,
    password: string,
  ): Promise<
    | { token: string; user: { id: string; email: string; role: UserRole } }
    | { requiresOtp: true; tempToken: string }
  > {
    const normalized = email.trim().toLowerCase();
    const user = await this.col.findOne({ email: normalized });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    if (user.totpSecret) {
      const tempToken = this.jwt.sign(
        { sub: user.id, email: normalized, purpose: 'otp' },
        { secret: JWT_SECRET, expiresIn: '5m' },
      );
      return { requiresOtp: true, tempToken };
    }
    const role = user.role ?? 'user';
    const token = this.jwt.sign(
      { sub: user.id, email: normalized, role },
      { secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN },
    );
    return { token, user: { id: user.id, email: normalized, role } };
  }

  async setupTotp(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.col.findOne({ id: userId });
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    const secret = speakeasy.generateSecret({ name: `CustomBrain (${user.email})`, length: 20 });
    await this.col.updateOne({ id: userId }, { $set: { totpSecret: secret.base32 } });
    return { secret: secret.base32, otpauthUrl: secret.otpauth_url ?? '' };
  }

  async verifyOtp(
    tempToken: string,
    otp: string,
  ): Promise<{ token: string; user: { id: string; email: string; role: UserRole } }> {
    const payload = this.jwt.verify(tempToken, { secret: JWT_SECRET }) as { sub?: string; purpose?: string };
    if (payload.purpose !== 'otp' || !payload.sub) throw new UnauthorizedException('잘못된 토큰입니다.');
    const user = await this.col.findOne({ id: payload.sub });
    if (!user?.totpSecret) throw new UnauthorizedException('OTP가 설정되지 않았습니다.');
    const valid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: otp,
      window: 1,
    });
    if (!valid) throw new UnauthorizedException('OTP가 일치하지 않습니다.');
    const role = user.role ?? 'user';
    const token = this.jwt.sign(
      { sub: user.id, email: user.email, role },
      { secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN },
    );
    return { token, user: { id: user.id, email: user.email, role } };
  }

  async getPasskeyRegisterOptions(userId: string, userEmail: string) {
    const user = await this.col.findOne({ id: userId });
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    const existing = (user.passkeyCredentials ?? []).map((c) => c.credentialID);
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID.includes(':') ? RP_ID.split(':')[0] : RP_ID,
      userID: Buffer.from(userId),
      userName: userEmail,
      attestationType: 'none',
      excludeCredentials: existing.length ? existing.map((id) => ({ id, type: 'public-key' })) : undefined,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });
    pendingChallenges.set(userId, options.challenge);
    return options;
  }

  async verifyPasskeyRegister(userId: string, body: RegistrationResponseJSON) {
    const challenge = pendingChallenges.get(userId);
    if (!challenge) throw new UnauthorizedException('등록 세션이 만료되었습니다.');
    pendingChallenges.delete(userId);
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID.includes(':') ? RP_ID.split(':')[0] : RP_ID,
    });
    if (!verification.verified || !verification.registrationInfo) {
      throw new UnauthorizedException('패스키 등록 검증에 실패했습니다.');
    }
    const { credential } = verification.registrationInfo;
    const cred: PasskeyCredential = {
      credentialID: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64'),
      counter: credential.counter,
      createdAt: new Date(),
    };
    await this.col.updateOne(
      { id: userId },
      { $push: { passkeyCredentials: cred } },
    );
    return { verified: true };
  }

  async getPasskeyAuthOptions() {
    const users = await this.col.find({ 'passkeyCredentials.0': { $exists: true } }).toArray();
    const allowCredentials = users.flatMap((u) =>
      (u.passkeyCredentials ?? []).map((c) => ({
        id: c.credentialID,
        type: 'public-key' as const,
      })),
    );
    const options = await generateAuthenticationOptions({
      rpID: RP_ID.includes(':') ? RP_ID.split(':')[0] : RP_ID,
      userVerification: 'preferred',
      allowCredentials: allowCredentials.length ? allowCredentials : undefined,
    });
    pendingChallenges.set('auth', options.challenge);
    return options;
  }

  async verifyPasskeyAuth(
    body: AuthenticationResponseJSON,
  ): Promise<{ token: string; user: { id: string; email: string; role: UserRole } }> {
    const challenge = pendingChallenges.get('auth');
    if (!challenge) throw new UnauthorizedException('인증 세션이 만료되었습니다.');
    pendingChallenges.delete('auth');
    const users = await this.col.find({ 'passkeyCredentials.0': { $exists: true } }).toArray();
    let user: User | null = null;
    let cred: PasskeyCredential | null = null;
    for (const u of users) {
      const c = (u.passkeyCredentials ?? []).find((x) => x.credentialID === body.id);
      if (c) {
        user = u;
        cred = c;
        break;
      }
    }
    if (!user || !cred) throw new UnauthorizedException('등록된 패스키가 없습니다.');
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID.includes(':') ? RP_ID.split(':')[0] : RP_ID,
      credential: {
        id: cred.credentialID,
        publicKey: Buffer.from(cred.publicKey, 'base64'),
        counter: cred.counter,
      },
    });
    if (!verification.verified) throw new UnauthorizedException('패스키 인증에 실패했습니다.');
    await this.col.updateOne(
      { id: user.id, 'passkeyCredentials.credentialID': cred.credentialID },
      { $set: { 'passkeyCredentials.$.counter': verification.authenticationInfo.newCounter } },
    );
    const role = user.role ?? 'user';
    const token = this.jwt.sign(
      { sub: user.id, email: user.email, role },
      { secret: JWT_SECRET, expiresIn: JWT_EXPIRES_IN },
    );
    return { token, user: { id: user.id, email: user.email, role } };
  }

  async validateUser(payload: { sub: string }): Promise<User | null> {
    return this.col.findOne({ id: payload.sub });
  }

  /** API 키 생성. 평문 키는 이 반환값에서만 확인 가능. */
  async createApiKey(
    userId: string,
    name?: string,
  ): Promise<{ id: string; name?: string; key: string; createdAt: Date }> {
    const user = await this.col.findOne({ id: userId });
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    const raw = randomBytes(32).toString('base64url');
    const key = `${API_KEY_PREFIX}${raw}`;
    const keyHash = hashApiKey(key);
    const id = randomUUID();
    const entry: ApiKeyEntry = { id, keyHash, name, createdAt: new Date() };
    await this.col.updateOne({ id: userId }, { $push: { apiKeys: entry } });
    return { id, name, key, createdAt: entry.createdAt };
  }

  /** 사용자 API 키 목록 (평문 키 없음, 마지막 4자만 표시용) */
  async listApiKeys(
    userId: string,
  ): Promise<{ id: string; name?: string; lastFour?: string; createdAt: Date }[]> {
    const user = await this.col.findOne({ id: userId });
    if (!user?.apiKeys?.length) return [];
    return user.apiKeys.map((k) => ({
      id: k.id,
      name: k.name,
      lastFour: undefined,
      createdAt: k.createdAt,
    }));
  }

  async revokeApiKey(userId: string, keyId: string): Promise<void> {
    const result = await this.col.updateOne(
      { id: userId, 'apiKeys.id': keyId },
      { $pull: { apiKeys: { id: keyId } } },
    );
    if (result.modifiedCount === 0) throw new ForbiddenException('API 키를 찾을 수 없거나 삭제할 수 없습니다.');
  }

  /** API 키로 사용자 조회. 인증 시 사용. */
  async validateApiKey(plainKey: string): Promise<{ id: string; email: string; role: UserRole } | null> {
    if (!plainKey || !plainKey.startsWith(API_KEY_PREFIX)) return null;
    const keyHash = hashApiKey(plainKey);
    const user = await this.col.findOne({ 'apiKeys.keyHash': keyHash });
    if (!user) return null;
    return { id: user.id, email: user.email, role: user.role ?? 'user' };
  }

  /** 관리자: 전체 사용자 목록 */
  async listUsers(): Promise<{ id: string; email: string; role: UserRole; createdAt: Date }[]> {
    const users = await this.col
      .find({}, { projection: { passwordHash: 0, totpSecret: 0, passkeyCredentials: 0, apiKeys: 0 } })
      .toArray();
    return users.map((u) => ({ id: u.id, email: u.email, role: u.role ?? 'user', createdAt: u.createdAt }));
  }

  /** 관리자: 사용자 역할 변경 */
  async setUserRole(userId: string, role: UserRole): Promise<void> {
    const result = await this.col.updateOne({ id: userId }, { $set: { role } });
    if (result.matchedCount === 0) throw new ForbiddenException('사용자를 찾을 수 없습니다.');
  }
}
