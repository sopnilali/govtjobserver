import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NoticesService } from './notices.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('notices')
@Controller('notices')
export class NoticesPublicController {
  constructor(private svc: NoticesService) {}
  @Get() list() { return this.svc.publicList(); }
  @Get(':slug') one(@Param('slug') slug: string) { return this.svc.publicOne(slug); }
}

@ApiTags('admin-notices')
@Controller('admin/notices')
@UseGuards(AuthGuard)
export class NoticesAdminController {
  constructor(private svc: NoticesService) {}
  @Get() list() { return this.svc.adminList(); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
  @Post(':id/publish') async publish(@Param('id', ParseIntPipe) id: number) { return this.svc.update(id, { status: 'published', publishedAt: new Date() }); }
  @Post(':id/unpublish') async unpublish(@Param('id', ParseIntPipe) id: number) { return this.svc.update(id, { status: 'draft' }); }
}
