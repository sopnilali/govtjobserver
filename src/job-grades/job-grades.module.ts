import { Module } from '@nestjs/common';
import { JobGradesPublicController, JobGradesAdminController } from './job-grades.controller';
import { JobGradesService } from './job-grades.service';

@Module({ controllers: [JobGradesPublicController, JobGradesAdminController], providers: [JobGradesService] })
export class JobGradesModule {}
