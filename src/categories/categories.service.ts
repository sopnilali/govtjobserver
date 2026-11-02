import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { makeSlug } from '../common/utils';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}
  publicList() {
    return this.prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, include: { _count: { select: { jobs: true } } } });
  }
  adminList() { return this.prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, include: { _count: { select: { jobs: true } } } }); }
  async bySlug(slug: string) {
    const cat = await this.prisma.category.findUnique({ where: { slug }, include: { _count: { select: { jobs: true } } } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }
  async jobsBySlug(slug: string, q: any) {
    const cat = await this.bySlug(slug);
    const page = Math.max(1, Number(q.page || 1)); const limit = Math.min(50, Number(q.limit || 12)); const skip = (page - 1) * limit;
    const where: any = { status: 'published', categories: { some: { categoryId: cat.id } } };
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    const [total, items] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({ where, include: { grade: true, institution: true }, orderBy: { publishedAt: 'desc' }, skip, take: limit }),
    ]);
    return { category: cat, data: items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
  async create(data: any) {
    if (!data.slug && data.name) data.slug = makeSlug(data.name);
    if (!data.slug) throw new BadRequestException('slug required');
    return this.prisma.category.create({ data });
  }
  async update(id: number, data: any) { return this.prisma.category.update({ where: { id }, data }); }
  async remove(id: number) {
    await this.prisma.jobCategory.deleteMany({ where: { categoryId: id } });
    return this.prisma.category.delete({ where: { id } });
  }
}
