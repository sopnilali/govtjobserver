import { Module } from '@nestjs/common';
import { InstitutionsController, InstitutionsAdminController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';

@Module({ controllers: [InstitutionsController, InstitutionsAdminController], providers: [InstitutionsService] })
export class InstitutionsModule {}
