import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('jobs')
@Controller('jobs')
export class JobsPublicController {
  constructor(private svc: JobsService) {}
  @Get() list(@Query() q: any) { return this.svc.publicList(q); }
  @Get('slug/:slug') bySlug(@Param('slug') slug: string) { return this.svc.publicBySlug(slug); }
  @Get(':id') byId(@Param('id', ParseIntPipe) id: number) { return this.svc.publicById(id); }
}

@ApiTags('admin-jobs')
@Controller('admin/jobs')
@UseGuards(AuthGuard)
export class JobsAdminController {
  constructor(private svc: JobsService) {}
  @Get() list(@Query() q: any) { return this.svc.adminList(q); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Get(':id') get(@Param('id', ParseIntPipe) id: number) { return this.svc.adminGet(id); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Patch(':id') patch(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
  @Post(':id/publish') publish(@Param('id', ParseIntPipe) id: number) { return this.svc.setStatus(id, 'published'); }
  @Post(':id/unpublish') unpublish(@Param('id', ParseIntPipe) id: number) { return this.svc.setStatus(id, 'draft'); }
  @Post(':id/duplicate') duplicate(@Param('id', ParseIntPipe) id: number) { return this.svc.duplicate(id); }
}
