import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { makeSlug } from '../common/utils';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}
  list(q: any) {
    const where: any = {};
    if (q?.search) where.name = { contains: q.search, mode: 'insensitive' };
    if (q?.public === '1') where.isActive = true;
    return this.prisma.institution.findMany({ where, orderBy: { name: 'asc' }, include: { _count: { select: { jobs: true } } } });
  }
  async bySlug(slug: string) {
    const inst = await this.prisma.institution.findUnique({ where: { slug }, include: { _count: { select: { jobs: true } } } });
    if (!inst) throw new NotFoundException('Institution not found');
    return inst;
  }
  async jobsBySlug(slug: string, q: any) {
    const inst = await this.bySlug(slug);
    const page = Math.max(1, Number(q.page || 1)); const limit = Math.min(50, Number(q.limit || 12)); const skip = (page - 1) * limit;
    const where: any = { status: 'published', institutionId: inst.id };
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    const [total, items] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({ where, include: { grade: true, institution: true }, orderBy: { publishedAt: 'desc' }, skip, take: limit }),
    ]);
    return { institution: inst, data: items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
  create(data: any) {
    if (!data.slug && data.name) data.slug = makeSlug(data.name);
    if (!data.slug) throw new BadRequestException('slug required');
    return this.prisma.institution.create({ data });
  }
  update(id: number, data: any) { return this.prisma.institution.update({ where: { id }, data }); }
  async remove(id: number) {
    const c = await this.prisma.job.count({ where: { institutionId: id } });
    if (c > 0) throw new BadRequestException(`Cannot delete: ${c} job(s) linked.`);
    return this.prisma.institution.delete({ where: { id } });
  }
}
