import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobGradesService {
  constructor(private prisma: PrismaService) {}

  listPublic() {
    return this.prisma.jobGrade.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  }
  listAdmin() {
    return this.prisma.jobGrade.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { jobs: true } } },
    });
  }
  get(id: number) {
    return this.prisma.jobGrade.findUnique({ where: { id }, include: { _count: { select: { jobs: true } } } });
  }
  async create(data: any) {
    if (!data.code) throw new BadRequestException('code is required');
    const exists = await this.prisma.jobGrade.findUnique({ where: { code: data.code } });
    if (exists) throw new BadRequestException('Grade code already exists');
    return this.prisma.jobGrade.create({ data });
  }
  async update(id: number, data: any) {
    const g = await this.prisma.jobGrade.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('Grade not found');
    if (data.code && data.code !== g.code) {
      const exists = await this.prisma.jobGrade.findUnique({ where: { code: data.code } });
      if (exists) throw new BadRequestException('Grade code already exists');
    }
    return this.prisma.jobGrade.update({ where: { id }, data });
  }
  async setStatus(id: number, isActive: boolean) {
    const g = await this.prisma.jobGrade.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('Grade not found');
    return this.prisma.jobGrade.update({ where: { id }, data: { isActive } });
  }
  async reorder(items: { id: number; sortOrder: number }[]) {
    await this.prisma.$transaction(items.map((i) => this.prisma.jobGrade.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })));
    return { message: 'Order updated' };
  }
  async remove(id: number) {
    const count = await this.prisma.job.count({ where: { gradeId: id } });
    if (count > 0) throw new BadRequestException(`Cannot delete: ${count} job(s) use this grade. Deactivate instead.`);
    return this.prisma.jobGrade.delete({ where: { id } });
  }
  async validateActiveGrade(gradeId?: number | null) {
    if (gradeId == null) return;
    const g = await this.prisma.jobGrade.findUnique({ where: { id: gradeId } });
    if (!g) throw new BadRequestException('Selected grade does not exist');
    if (!g.isActive) throw new BadRequestException('Selected grade is inactive');
  }
}
