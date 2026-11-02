import { Module } from '@nestjs/common';
import { NoticesPublicController, NoticesAdminController } from './notices.controller';
import { NoticesService } from './notices.service';

@Module({ controllers: [NoticesPublicController, NoticesAdminController], providers: [NoticesService] })
export class NoticesModule {}
