import { Module } from '@nestjs/common';
import { PagesPublicController, PagesAdminController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({ controllers: [PagesPublicController, PagesAdminController], providers: [PagesService] })
export class PagesModule {}
