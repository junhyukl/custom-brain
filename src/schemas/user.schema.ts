/**
 * 인증용 사용자 (Mongo users 컬렉션).
 * 2FA: passwordHash + totpSecret(OTP).
 * Passkey: passkeyCredentials (WebAuthn).
 * 역할: admin, manager, user.
 * API 키: apiKeys (해시만 저장, 평문 키는 발급 시 1회만 반환).
 */
export type UserRole = 'admin' | 'manager' | 'user';

export interface ApiKeyEntry {
  id: string;
  /** SHA-256 해시 (평문 키는 저장하지 않음) */
  keyHash: string;
  name?: string;
  createdAt: Date;
}

export interface PasskeyCredential {
  credentialID: string;
  publicKey: string;
  counter: number;
  deviceType?: string;
  backedUp?: boolean;
  transports?: string[];
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  /** 없으면 'user'로 간주 (기존 문서 호환) */
  role?: UserRole;
  totpSecret?: string;
  passkeyCredentials?: PasskeyCredential[];
  apiKeys?: ApiKeyEntry[];
  createdAt: Date;
}
