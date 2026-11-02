import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}
  async summary() {
    const [totalJobs, published, drafts, institutions, categories, authors, notices, pages] = await Promise.all([
      this.prisma.job.count(),
      this.prisma.job.count({ where: { status: 'published' } }),
      this.prisma.job.count({ where: { status: 'draft' } }),
      this.prisma.institution.count(),
      this.prisma.category.count(),
      this.prisma.author.count(),
      this.prisma.notice.count(),
      this.prisma.page.count(),
    ]);
    return { totalJobs, publishedJobs: published, draftJobs: drafts, totalInstitutions: institutions, totalCategories: categories, totalAuthors: authors, totalNotices: notices, totalPages: pages };
  }
  recentJobs() {
    return this.prisma.job.findMany({ orderBy: { updatedAt: 'desc' }, take: 10, include: { institution: true, grade: true } });
  }
}
