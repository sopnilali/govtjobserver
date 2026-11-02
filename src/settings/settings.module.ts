import { Module } from '@nestjs/common';
import { SettingsController, SettingsPublicController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({ controllers: [SettingsController, SettingsPublicController], providers: [SettingsService] })
export class SettingsModule {}
