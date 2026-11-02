import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('pages')
@Controller('pages')
export class PagesPublicController {
  constructor(private svc: PagesService) {}
  @Get() list() { return this.svc.publicList(); }
  @Get(':slug') one(@Param('slug') slug: string) { return this.svc.publicOne(slug); }
}

@ApiTags('admin-pages')
@Controller('admin/pages')
@UseGuards(AuthGuard)
export class PagesAdminController {
  constructor(private svc: PagesService) {}
  @Get() list() { return this.svc.adminList(); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
