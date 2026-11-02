import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const cookieName = process.env.COOKIE_NAME || 'bdjobs_token';
    let token: string | undefined = req.cookies?.[cookieName];
    const header = req.headers?.authorization;
    if (!token && header?.startsWith('Bearer ')) token = header.slice(7);
    if (!token) throw new UnauthorizedException('Not authenticated');
    try {
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET || 'dev-secret-change-me-please-32chars' });
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
