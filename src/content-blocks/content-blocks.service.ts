import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { cleanHtml } from '../common/utils';

@Injectable()
export class ContentBlocksService {
  constructor(private prisma: PrismaService) {}
  list(jobId: number) { return this.prisma.contentBlock.findMany({ where: { jobId }, orderBy: { sortOrder: 'asc' } }); }
  create(jobId: number, data: any) {
    if (data.content) data.content = cleanHtml(data.content);
    return this.prisma.contentBlock.create({ data: { ...data, jobId } });
  }
  update(id: number, data: any) {
    if (data.content) data.content = cleanHtml(data.content);
    return this.prisma.contentBlock.update({ where: { id }, data });
  }
  remove(id: number) { return this.prisma.contentBlock.delete({ where: { id } }); }
  async reorder(jobId: number, items: { id: number; sortOrder: number }[]) {
    await this.prisma.$transaction(items.map((i) => this.prisma.contentBlock.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })));
    return this.list(jobId);
  }
}
