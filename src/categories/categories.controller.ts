import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private svc: CategoriesService) {}
  @Get() list() { return this.svc.publicList(); }
  @Get(':slug') one(@Param('slug') slug: string) { return this.svc.bySlug(slug); }
  @Get(':slug/jobs') jobs(@Param('slug') slug: string, @Query() q: any) { return this.svc.jobsBySlug(slug, q); }
}

@ApiTags('admin-categories')
@Controller('admin/categories')
@UseGuards(AuthGuard)
export class CategoriesAdminController {
  constructor(private svc: CategoriesService) {}
  @Get() list() { return this.svc.adminList(); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
