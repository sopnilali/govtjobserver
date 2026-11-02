import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('settings')
@Controller('settings')
export class SettingsPublicController {
  constructor(private svc: SettingsService) {}
  @Get('public') pub() { return this.svc.publicSettings(); }
}

@ApiTags('admin-settings')
@Controller('admin')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private svc: SettingsService) {}
  @Get('settings') all() { return this.svc.adminSettings(); }
  @Put('settings') save(@Body() b: any) { return this.svc.saveAll(b.settings || b); }
  @Get('seo/global') seo() { return this.svc.globalSeo(); }
  @Put('seo/global') saveSeo(@Body() b: any) { return this.svc.saveGlobalSeo(b); }
}
