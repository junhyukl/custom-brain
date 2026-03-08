import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { SKIP_AUTH, JWT_SECRET } from '../../common/constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    if (SKIP_AUTH) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('Bearer token required');
    try {
      const payload = this.jwt.verify(token, { secret: JWT_SECRET }) as { sub: string; email?: string };
      (req as Request & { user?: unknown }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
