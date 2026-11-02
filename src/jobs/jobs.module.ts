import { Module } from '@nestjs/common';
import { JobsPublicController, JobsAdminController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobGradesService } from '../job-grades/job-grades.service';

@Module({ controllers: [JobsPublicController, JobsAdminController], providers: [JobsService, JobGradesService] })
export class JobsModule {}
