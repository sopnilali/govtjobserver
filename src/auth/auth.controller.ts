import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

class LoginDto { @IsEmail() email: string; @IsString() @MinLength(1) password: string; }
class ForgotDto { @IsEmail() email: string; }
class ResetDto { @IsString() token: string; @IsString() @MinLength(8) newPassword: string; }

function cookieOpts() {
  return { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000, path: '/' };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto.email, dto.password);
    res.cookie(process.env.COOKIE_NAME || 'bdjobs_token', token, cookieOpts());
    return { token, user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(process.env.COOKIE_NAME || 'bdjobs_token', { path: '/' });
    return { message: 'Logged out' };
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: { sub: number } }) { return this.auth.me(req.user.sub); }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotDto) { return this.auth.forgotPassword(dto.email); }

  @Post('reset-password')
  reset(@Body() dto: ResetDto) { return this.auth.resetPassword(dto.token, dto.newPassword); }
}
