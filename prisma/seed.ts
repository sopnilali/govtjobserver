import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@bdjobs.gov.bd';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const hash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    create: { name: process.env.ADMIN_NAME || 'Site Administrator', email, passwordHash: hash, role: 'admin' },
    update: { passwordHash: hash, name: process.env.ADMIN_NAME || 'Site Administrator' },
  });

  // Grades
  const grades = [
    { name: 'Grade 9', label: '৯ম গ্রেড', code: 'G9', salaryMin: 22000, salaryMax: 53060, sortOrder: 9 },
    { name: 'Grade 10', label: '১০ম গ্রেড', code: 'G10', salaryMin: 16000, salaryMax: 38640, sortOrder: 10 },
    { name: 'Grade 11', label: '১১তম গ্রেড', code: 'G11', salaryMin: 12500, salaryMax: 30230, sortOrder: 11 },
    { name: 'Grade 13', label: '১৩তম গ্রেড', code: 'G13', salaryMin: 11000, salaryMax: 26590, sortOrder: 13 },
    { name: 'Grade 16', label: '১৬তম গ্রেড', code: 'G16', salaryMin: 9300, salaryMax: 22490, sortOrder: 16 },
    { name: 'Grade 20', label: '২০তম গ্রেড', code: 'G20', salaryMin: 8250, salaryMax: 20010, sortOrder: 20 },
  ];
  for (const g of grades) await prisma.jobGrade.upsert({ where: { code: g.code }, create: g, update: g });

  // Sample categories / institutions / author
  const cat = await prisma.category.upsert({ where: { slug: 'ministry-jobs' }, create: { name: 'Ministry Jobs', slug: 'ministry-jobs', description: 'All ministry circulars', sortOrder: 1 }, update: {} });
  const inst = await prisma.institution.upsert({ where: { slug: 'bangladesh-secretariat' }, create: { name: 'Bangladesh Secretariat', slug: 'bangladesh-secretariat', type: 'Secretariat', description: 'Central administration of the Government of Bangladesh.' }, update: {} });
  const author = await prisma.author.upsert({ where: { slug: 'admin' }, create: { name: 'Admin', slug: 'admin', designation: 'Editor' }, update: {} });

  await prisma.siteSetting.upsert({ where: { key: 'site_name' }, create: { key: 'site_name', value: 'BD Govt Jobs' }, update: {} });
  await prisma.siteSetting.upsert({ where: { key: 'site_tagline' }, create: { key: 'site_tagline', value: 'All Bangladesh Government Job Circulars' }, update: {} });
  await prisma.seoMetadata.upsert({ where: { scope: 'global' }, create: { scope: 'global', title: 'BD Govt Jobs - Government Job Circulars Bangladesh', description: 'Latest Bangladesh government job circulars, notices and results.' }, update: {} });

  // Sample published job (only if none)
  const count = await prisma.job.count();
  if (count === 0) {
    const g9 = await prisma.jobGrade.findUnique({ where: { code: 'G9' } });
    const job = await prisma.job.create({
      data: {
        title: 'Sample: Assistant Secretary Recruitment 2026',
        slug: 'assistant-secretary-recruitment-2026',
        shortInfo: 'Sample circular. Replace with official information.',
        totalPosts: 50, jobType: 'full-time', salaryOverride: 22000,
        education: 'Honors/Masters from recognized university.', ageLimit: '21-32 years',
        applicationFee: 'BDT 500', applyUrl: 'http://example.gov.bd/apply',
        status: 'published', publishedAt: new Date(), applyStart: new Date(),
        applyDeadline: new Date(Date.now() + 30 * 864e5),
        gradeId: g9?.id, institutionId: inst.id, authorId: author.id,
      },
    });
    await prisma.jobCategory.create({ data: { jobId: job.id, categoryId: cat.id } });
    await prisma.contentBlock.create({ data: { jobId: job.id, type: 'paragraph', title: 'Instructions', content: '<p>Apply through the official link before the deadline.</p>', sortOrder: 1 } });
    await prisma.notice.create({ data: { title: 'Welcome to BD Govt Jobs Portal', slug: 'welcome', content: '<p>Latest circulars will appear here.</p>', status: 'published', publishedAt: new Date() } });
    await prisma.page.create({ data: { title: 'About Us', slug: 'about-us', content: '<p>BD Govt Jobs publishes official government circulars.</p>', status: 'published' } });
    await prisma.page.create({ data: { title: 'Privacy Policy', slug: 'privacy-policy', content: '<p>We do not collect personal data on public pages.</p>', status: 'published' } });
    await prisma.page.create({ data: { title: 'Terms and Conditions', slug: 'terms', content: '<p>Always verify from the official circular.</p>', status: 'published' } });
  }
  console.log('Seed complete. Admin:', email);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
