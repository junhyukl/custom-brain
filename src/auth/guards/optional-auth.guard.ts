import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SKIP_AUTH, JWT_SECRET } from '../../common/constants';

/**
 * 인증이 있으면 user를 붙이고, 없으면 통과. SKIP_AUTH 시 항상 통과.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    if (SKIP_AUTH) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) return true;
    try {
      const payload = this.jwt.verify(token, { secret: JWT_SECRET }) as { sub: string; email?: string };
      (req as Request & { user?: unknown }).user = payload;
    } catch {
      // ignore invalid token
    }
    return true;
  }
}
