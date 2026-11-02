import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FaqsService {
  constructor(private prisma: PrismaService) {}
  list(jobId?: number) {
    const where: any = {};
    if (jobId) where.jobId = jobId;
    return this.prisma.faq.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }
  create(data: any) { return this.prisma.faq.create({ data }); }
  update(id: number, data: any) { return this.prisma.faq.update({ where: { id }, data }); }
  remove(id: number) { return this.prisma.faq.delete({ where: { id } }); }
}
