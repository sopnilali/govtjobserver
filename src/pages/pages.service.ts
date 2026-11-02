import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { makeSlug, cleanHtml } from '../common/utils';

@Injectable()
export class PagesService {
  constructor(private prisma: PrismaService) {}
  publicList() { return this.prisma.page.findMany({ where: { status: 'published' }, select: { id: true, title: true, slug: true, updatedAt: true } }); }
  async publicOne(slug: string) {
    const p = await this.prisma.page.findUnique({ where: { slug } });
    if (!p || p.status !== 'published') throw new NotFoundException('Page not found');
    return p;
  }
  adminList() { return this.prisma.page.findMany({ orderBy: { updatedAt: 'desc' } }); }
  create(data: any) {
    if (!data.slug && data.title) data.slug = makeSlug(data.title);
    if (data.content) data.content = cleanHtml(data.content);
    return this.prisma.page.create({ data });
  }
  update(id: number, data: any) {
    if (data.content) data.content = cleanHtml(data.content);
    return this.prisma.page.update({ where: { id }, data });
  }
  remove(id: number) { return this.prisma.page.delete({ where: { id } }); }
}
