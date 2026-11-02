import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JobGradesModule } from './job-grades/job-grades.module';
import { JobsModule } from './jobs/jobs.module';
import { CategoriesModule } from './categories/categories.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { AuthorsModule } from './authors/authors.module';
import { ContentBlocksModule } from './content-blocks/content-blocks.module';
import { NoticesModule } from './notices/notices.module';
import { PagesModule } from './pages/pages.module';
import { FaqsModule } from './faqs/faqs.module';
import { MediaModule } from './media/media.module';
import { SettingsModule } from './settings/settings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SeoModule } from './seo/seo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    DashboardModule,
    JobGradesModule,
    JobsModule,
    CategoriesModule,
    InstitutionsModule,
    AuthorsModule,
    ContentBlocksModule,
    NoticesModule,
    PagesModule,
    FaqsModule,
    MediaModule,
    SettingsModule,
    SeoModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
