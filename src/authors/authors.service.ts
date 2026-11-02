import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { makeSlug } from '../common/utils';

@Injectable()
export class AuthorsService {
  constructor(private prisma: PrismaService) {}
  list(publicOnly: boolean) {
    const where: any = publicOnly ? { isActive: true } : {};
    return this.prisma.author.findMany({ where, orderBy: { name: 'asc' }, include: { _count: { select: { jobs: true } } } });
  }
  async bySlug(slug: string) {
    const a = await this.prisma.author.findUnique({ where: { slug } });
    if (!a) throw new NotFoundException('Author not found');
    const { ...safe } = a;
    return safe;
  }
  async jobsBySlug(slug: string, q: any) {
    const a = await this.bySlug(slug);
    const where: any = { status: 'published', authorId: (a as any).id };
    const items = await this.prisma.job.findMany({ where, include: { grade: true, institution: true }, orderBy: { publishedAt: 'desc' }, take: 50 });
    return { author: a, data: items };
  }
  create(data: any) {
    if (!data.slug && data.name) data.slug = makeSlug(data.name);
    if (!data.slug) throw new BadRequestException('slug required');
    return this.prisma.author.create({ data });
  }
  update(id: number, data: any) { return this.prisma.author.update({ where: { id }, data }); }
  async remove(id: number) {
    // deactivate instead of hard delete if jobs exist
    const c = await this.prisma.job.count({ where: { authorId: id } });
    if (c > 0) return this.prisma.author.update({ where: { id }, data: { isActive: false } });
    return this.prisma.author.delete({ where: { id } });
  }
}
