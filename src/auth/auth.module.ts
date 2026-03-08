import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { MongoModule } from '../mongo/mongo.module';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../common/constants';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthSeedService } from './auth-seed.service';
import { GlobalAuthGuard } from './guards/global-auth.guard';

@Module({
  imports: [
    MongoModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES_IN },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSeedService,
    { provide: APP_GUARD, useClass: GlobalAuthGuard },
  ],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
