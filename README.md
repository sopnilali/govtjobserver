# BD Govt Jobs Portal

Bangladesh Government Jobs Portal — NestJS + Prisma + PostgreSQL + Bootstrap 5 vanilla-JS frontend.

## Quick Start

1. Install Node 20+, PostgreSQL 14+.
2. `cp .env.example .env` and set `DATABASE_URL`, `JWT_SECRET`.
3. `npm install`
4. `npx prisma migrate dev --name init`
5. `npm run seed` (creates admin + grades + sample job)
6. `npm run start:dev` → http://localhost:4000
   - Public site: `/`
   - Admin: `/admin/login.html` (default `admin@bdjobs.gov.bd / Admin@12345`)
   - Swagger: `/api/docs`

## Structure

- `src/` NestJS modules: auth, dashboard, jobs, job-grades, categories, institutions, authors, content-blocks, notices, pages, faqs, media, settings, seo (+ sitemap/robots)
- `prisma/schema.prisma`, `prisma/seed.ts`
- `public/` static frontend (Bootstrap 5 + vanilla JS). Served by Nest; API under `/api/v1`.
- `uploads/` local file storage (served at `/uploads/*`).

## Key Workflow (most important)

1. Admin → Job Grades → Add grade (e.g. Grade 9 / ৯ম গ্রেড / G9 / 22000-53060).
2. Grade appears dynamically in Add New Job form via `GET /api/v1/job-grades`.
3. Add Job → select grade (salary prefilled, override allowed) → assign institution/author/categories → upload circular via Media Library (paste URL) → Save → Publish.
4. Job appears on `/jobs.html` and `/job-details.html?slug=...` with summary card + status (Running/Closed/Upcoming).

Grade rules: backend validates grade exists + active on create/change; inactive grades preserved on old jobs; delete blocked when jobs use the grade.

## API

All prefixed `/api/v1`. See Swagger `/api/docs` and `postman-collection.json`.

## Deploy

- Set env vars, `npx prisma migrate deploy`, `npm run build`, `npm run start:prod`.
- Use object storage (S3) for `uploads/` in production; set `FRONTEND_URL`, `CORS_ORIGIN`, secure cookies.
