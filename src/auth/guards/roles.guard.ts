import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../schemas';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from './global-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;
    const req = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;
    if (!user?.role) throw new ForbiddenException('역할 정보가 없습니다.');
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`이 작업은 ${requiredRoles.join(' 또는 ')} 권한이 필요합니다.`);
    }
    return true;
  }
}
