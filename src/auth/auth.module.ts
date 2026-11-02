import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';

@Global()
@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'dev-secret-change-me-please-32chars', signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } })],
  providers: [AuthService, AuthGuard],
  controllers: [AuthController],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}
