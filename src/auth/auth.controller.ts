import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import type { Request } from 'express';
import type { AuthUser } from './guards/global-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  async me(@Req() req: Request) {
    const user = (req as Request & { user?: AuthUser }).user;
    if (!user?.sub) throw new UnauthorizedException('unauthorized');
    const full = await this.auth.validateUser({ sub: user.sub });
    if (!full) throw new UnauthorizedException('user not found');
    return { id: full.id, email: full.email, role: full.role ?? 'user' };
  }

  @Post('register')
  @Public()
  async register(@Body() body: { email?: string; password?: string }) {
    const email = body?.email?.trim();
    const password = body?.password;
    if (!email || !password) throw new BadRequestException('email and password required');
    return this.auth.register(email, password);
  }

  @Post('login')
  @Public()
  async login(@Body() body: { email?: string; password?: string }) {
    const email = body?.email?.trim();
    const password = body?.password;
    if (!email || !password) throw new BadRequestException('email and password required');
    return this.auth.login(email, password);
  }

  @Post('verify-otp')
  @Public()
  async verifyOtp(@Body() body: { tempToken?: string; otp?: string }) {
    if (!body?.tempToken || !body?.otp) throw new BadRequestException('tempToken and otp required');
    return this.auth.verifyOtp(body.tempToken, body.otp);
  }

  @Post('setup-otp')
  async setupOtp(@Req() req: Request) {
    const userId = (req as Request & { user?: AuthUser }).user?.sub;
    if (!userId) throw new UnauthorizedException('unauthorized');
    return this.auth.setupTotp(userId);
  }

  @Get('passkey/register/options')
  async getPasskeyRegisterOptions(@Req() req: Request) {
    const user = (req as Request & { user?: AuthUser }).user;
    if (!user?.sub) throw new UnauthorizedException('unauthorized');
    return this.auth.getPasskeyRegisterOptions(user.sub, user.email ?? '');
  }

  @Post('passkey/register')
  async verifyPasskeyRegister(@Req() req: Request, @Body() body: unknown) {
    const userId = (req as Request & { user?: AuthUser }).user?.sub;
    if (!userId) throw new UnauthorizedException('unauthorized');
    return this.auth.verifyPasskeyRegister(userId, body as import('@simplewebauthn/server').RegistrationResponseJSON);
  }

  @Get('passkey/auth/options')
  @Public()
  async getPasskeyAuthOptions() {
    return this.auth.getPasskeyAuthOptions();
  }

  @Post('passkey/auth')
  @Public()
  async verifyPasskeyAuth(@Body() body: unknown) {
    return this.auth.verifyPasskeyAuth(body as import('@simplewebauthn/server').AuthenticationResponseJSON);
  }

  @Post('api-keys')
  async createApiKey(@Req() req: Request, @Body() body: { name?: string }) {
    const userId = (req as Request & { user?: AuthUser }).user?.sub;
    if (!userId) throw new UnauthorizedException('unauthorized');
    return this.auth.createApiKey(userId, body?.name?.trim());
  }

  @Get('api-keys')
  async listApiKeys(@Req() req: Request) {
    const userId = (req as Request & { user?: AuthUser }).user?.sub;
    if (!userId) throw new UnauthorizedException('unauthorized');
    return this.auth.listApiKeys(userId);
  }

  @Delete('api-keys/:id')
  async revokeApiKey(@Req() req: Request, @Param('id') keyId: string) {
    const userId = (req as Request & { user?: AuthUser }).user?.sub;
    if (!userId) throw new UnauthorizedException('unauthorized');
    await this.auth.revokeApiKey(userId, keyId);
    return { revoked: true };
  }

  @Get('admin/users')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async listUsers() {
    return this.auth.listUsers();
  }

  @Patch('admin/users/:id/role')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async setUserRole(@Param('id') userId: string, @Body() body: { role?: string }) {
    const role = body?.role as 'admin' | 'manager' | 'user' | undefined;
    if (!role || !['admin', 'manager', 'user'].includes(role)) {
      throw new BadRequestException('role must be admin, manager, or user');
    }
    await this.auth.setUserRole(userId, role);
    return { updated: true };
  }
}
