import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role, name: user.name });
    await this.prisma.auditLog.create({ data: { adminId: user.id, action: 'login', entity: 'AdminUser', entityId: user.id } });
    const { passwordHash, ...safe } = user;
    return { token, user: safe };
  }

  async me(userId: number) {
    const user = await this.prisma.adminUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async forgotPassword(email: string) {
    // Do not leak existence; return generic message. Store a reset token as audit log for simplicity.
    const user = await this.prisma.adminUser.findUnique({ where: { email } });
    if (user) {
      const token = await this.jwt.signAsync({ sub: user.id, purpose: 'reset' }, { expiresIn: '1h' });
      await this.prisma.auditLog.create({ data: { adminId: user.id, action: `password-reset-request:${token}`, entity: 'AdminUser', entityId: user.id } });
    }
    return { message: 'If the email exists, a reset link has been generated. Contact the site owner in this simple build.' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) throw new BadRequestException('Password must be at least 8 characters');
    try {
      const payload: any = await this.jwt.verifyAsync(token);
      if (payload.purpose !== 'reset') throw new Error('bad purpose');
      const hash = await bcrypt.hash(newPassword, 10);
      await this.prisma.adminUser.update({ where: { id: payload.sub }, data: { passwordHash: hash } });
      return { message: 'Password reset successful' };
    } catch {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }
}
