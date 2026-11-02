import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { makeSlug, cleanHtml } from '../common/utils';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}
  publicList() { return this.prisma.notice.findMany({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, take: 100 }); }
  async publicOne(slug: string) {
    const n = await this.prisma.notice.findUnique({ where: { slug } });
    if (!n || n.status !== 'published') throw new NotFoundException('Notice not found');
    return n;
  }
  adminList() { return this.prisma.notice.findMany({ orderBy: { updatedAt: 'desc' }, take: 200 }); }
  create(data: any) {
    if (!data.slug && data.title) data.slug = makeSlug(data.title);
    if (data.content) data.content = cleanHtml(data.content);
    if (data.status === 'published' && !data.publishedAt) data.publishedAt = new Date();
    return this.prisma.notice.create({ data });
  }
  update(id: number, data: any) {
    if (data.content) data.content = cleanHtml(data.content);
    return this.prisma.notice.update({ where: { id }, data });
  }
  remove(id: number) { return this.prisma.notice.delete({ where: { id } }); }
}
