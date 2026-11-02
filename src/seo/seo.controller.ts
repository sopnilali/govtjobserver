import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class SeoController {
  constructor(private prisma: PrismaService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async sitemap(@Res() res: Response) {
    const base = process.env.FRONTEND_URL || 'http://localhost:4000';
    const jobs = await this.prisma.job.findMany({ where: { status: 'published' }, select: { slug: true, updatedAt: true }, take: 5000 });
    const pages = await this.prisma.page.findMany({ where: { status: 'published' }, select: { slug: true, updatedAt: true } });
    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    xml += `<url><loc>${base}/</loc></url><url><loc>${base}/jobs.html</loc></url>`;
    jobs.forEach((j) => { xml += `<url><loc>${base}/job-details.html?slug=${j.slug}</loc><lastmod>${j.updatedAt.toISOString()}</lastmod></url>`; });
    pages.forEach((p) => { xml += `<url><loc>${base}/page.html?slug=${p.slug}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`; });
    xml += `</urlset>`;
    res.send(xml);
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  robots(@Res() res: Response) {
    const base = process.env.FRONTEND_URL || 'http://localhost:4000';
    res.send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
  }
}
