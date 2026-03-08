import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SKIP_AUTH, JWT_SECRET } from '../../common/constants';
import type { UserRole } from '../../schemas';
import { AuthService } from '../auth.service';

export const PUBLIC_KEY = 'isPublic';

export type AuthUser = { sub: string; email?: string; role: UserRole; apiKey?: boolean };

/**
 * 전역 인증 가드. SKIP_AUTH 이면 항상 통과 (로컬/테스트).
 * PUBLIC_KEY 메타데이터가 있으면 통과.
 * 그 외: Authorization: Bearer <jwt> 또는 X-API-Key / Authorization: ApiKey <key> 로 인증.
 */
@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (SKIP_AUTH) return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

    const bearerToken = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    const apiKeyFromAuth = auth?.startsWith('ApiKey ') ? auth.slice(7) : undefined;
    const apiKey = apiKeyHeader ?? apiKeyFromAuth;

    if (bearerToken && !bearerToken.startsWith('cb_')) {
      try {
        const payload = this.jwt.verify(bearerToken, { secret: JWT_SECRET }) as AuthUser;
        (req as Request & { user?: AuthUser }).user = {
          sub: payload.sub,
          email: payload.email,
          role: payload.role ?? 'user',
        };
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
    if (apiKey) {
      const user = await this.authService.validateApiKey(apiKey);
      if (user) {
        (req as Request & { user?: AuthUser }).user = {
          sub: user.id,
          email: user.email,
          role: user.role,
          apiKey: true,
        };
        return true;
      }
      throw new UnauthorizedException('Invalid API key');
    }
    throw new UnauthorizedException('Bearer token or X-API-Key required');
  }
}
