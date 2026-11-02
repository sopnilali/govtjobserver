import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { makeSlug, cleanHtml, jobApplicationStatus, isValidUrl } from '../common/utils';
import { JobGradesService } from '../job-grades/job-grades.service';

const jobInclude = {
  grade: true, institution: true,
  author: { select: { id: true, name: true, slug: true, profileImage: true, designation: true, bio: true } },
  categories: { include: { category: true } },
  contentBlocks: { where: { isVisible: true }, orderBy: { sortOrder: 'asc' as const } },
  circulars: true,
  faqs: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
};

function shape(job: any) {
  if (!job) return job;
  return { ...job, applicationStatus: jobApplicationStatus(job) };
}

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService, private grades: JobGradesService) {}

  // ---------- PUBLIC ----------
  async publicList(q: any) {
    const page = Math.max(1, Number(q.page || 1));
    const limit = Math.min(50, Math.max(1, Number(q.limit || 12)));
    const skip = (page - 1) * limit;
    const where: any = { status: 'published' };
    if (q.search) where.OR = [
      { title: { contains: q.search, mode: 'insensitive' } },
      { institution: { name: { contains: q.search, mode: 'insensitive' } } },
    ];
    if (q.category) where.categories = { some: { category: { slug: q.category } } };
    if (q.institution) where.institution = { slug: q.institution };
    if (q.grade) where.grade = { code: q.grade };
    if (q.jobType) where.jobType = q.jobType;
    const orderBy: any = q.sort === 'deadline' ? { applyDeadline: 'asc' } : { publishedAt: 'desc' };
    const [total, items] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({ where, include: { grade: true, institution: true, categories: { include: { category: true } } }, orderBy, skip, take: limit }),
    ]);
    return { data: items.map(shape), meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async publicBySlug(slug: string) {
    const job = await this.prisma.job.findUnique({ where: { slug }, include: jobInclude });
    if (!job || job.status !== 'published') throw new NotFoundException('Job not found');
    await this.prisma.job.update({ where: { id: job.id }, data: { viewCount: { increment: 1 } } });
    const related = await this.prisma.job.findMany({
      where: { status: 'published', id: { not: job.id }, OR: [{ institutionId: job.institutionId }, { gradeId: job.gradeId }] },
      take: 6, orderBy: { publishedAt: 'desc' },
      include: { grade: true, institution: true },
    });
    return { ...shape(job), related: related.map(shape) };
  }

  async publicById(id: number) {
    const job = await this.prisma.job.findUnique({ where: { id }, include: jobInclude });
    if (!job || job.status !== 'published') throw new NotFoundException('Job not found');
    return shape(job);
  }

  // ---------- ADMIN ----------
  adminList(q: any) {
    const where: any = {};
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    if (q.status) where.status = q.status;
    return this.prisma.job.findMany({ where, include: { grade: true, institution: true, author: true }, orderBy: { updatedAt: 'desc' }, take: 200 });
  }
  adminGet(id: number) {
    return this.prisma.job.findUnique({
      where: { id },
      include: { grade: true, institution: true, author: true, categories: { include: { category: true } }, contentBlocks: { orderBy: { sortOrder: 'asc' } }, circulars: true, faqs: true },
    });
  }

  private async prepare(data: any, isNew: boolean) {
    if (data.applyUrl && !isValidUrl(data.applyUrl)) throw new BadRequestException('applyUrl must be a valid http(s) URL');
    await this.grades.validateActiveGrade(data.gradeId ?? undefined);
    // auto-prefill salaryOverride from grade if not provided
    if (data.gradeId && data.salaryOverride == null) {
      const g = await this.prisma.jobGrade.findUnique({ where: { id: data.gradeId } });
      if (g?.salaryMin) data.salaryOverride = g.salaryMin;
    }
    if (data.contentBlocks === undefined) delete data.contentBlocks;
    const { categoryIds, ...rest } = data;
    if (rest.content) rest.content = undefined;
    const clean: any = { ...rest };
    ['shortInfo', 'education', 'experience'].forEach((k) => { if (typeof clean[k] === 'string') clean[k] = cleanHtml(clean[k]); });
    if (!clean.slug && clean.title) clean.slug = makeSlug(clean.title);
    return { clean, categoryIds };
  }

  async create(data: any) {
    const { clean, categoryIds } = await this.prepare(data, true);
    if (clean.slug) {
      const ex = await this.prisma.job.findUnique({ where: { slug: clean.slug } });
      if (ex) clean.slug = `${clean.slug}-${Date.now().toString(36)}`;
    }
    if (clean.status === 'published' && !clean.publishedAt) clean.publishedAt = new Date();
    const job = await this.prisma.job.create({ data: clean });
    if (Array.isArray(categoryIds) && categoryIds.length) {
      await this.prisma.jobCategory.createMany({ data: categoryIds.map((cid: number) => ({ jobId: job.id, categoryId: cid })), skipDuplicates: true });
    }
    return this.adminGet(job.id);
  }

  async update(id: number, data: any) {
    const existing = await this.prisma.job.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Job not found');
    // if grade changed, validate active; if unchanged allow inactive (preserve)
    if (data.gradeId !== undefined && data.gradeId !== existing.gradeId) await this.grades.validateActiveGrade(data.gradeId);
    const { clean, categoryIds } = await this.prepare(data, false);
    if (clean.status === 'published' && !existing.publishedAt && !clean.publishedAt) clean.publishedAt = new Date();
    await this.prisma.job.update({ where: { id }, data: clean });
    if (Array.isArray(categoryIds)) {
      await this.prisma.jobCategory.deleteMany({ where: { jobId: id } });
      if (categoryIds.length) await this.prisma.jobCategory.createMany({ data: categoryIds.map((cid: number) => ({ jobId: id, categoryId: cid })), skipDuplicates: true });
    }
    return this.adminGet(id);
  }

  async remove(id: number) {
    await this.prisma.job.delete({ where: { id } });
    return { message: 'Job deleted' };
  }

  async setStatus(id: number, status: 'published' | 'draft') {
    const data: any = { status };
    if (status === 'published') data.publishedAt = new Date();
    await this.prisma.job.update({ where: { id }, data });
    return this.adminGet(id);
  }

  async duplicate(id: number) {
    const src: any = await this.adminGet(id);
    if (!src) throw new NotFoundException('Job not found');
    const { id: _i, slug: _s, categories, contentBlocks, circulars, faqs, createdAt, updatedAt, ...rest } = src;
    const copy = await this.prisma.job.create({
      data: { ...rest, title: `${rest.title} (Copy)`, slug: `${rest.slug}-copy-${Date.now().toString(36)}`, status: 'draft', publishedAt: null },
    });
    if (categories?.length) await this.prisma.jobCategory.createMany({ data: categories.map((c: any) => ({ jobId: copy.id, categoryId: c.categoryId })), skipDuplicates: true });
    if (contentBlocks?.length) await this.prisma.contentBlock.createMany({ data: contentBlocks.map((b: any) => ({ jobId: copy.id, type: b.type, title: b.title, content: b.content, meta: b.meta ?? undefined, sortOrder: b.sortOrder, isVisible: b.isVisible })) });
    return this.adminGet(copy.id);
  }
}
