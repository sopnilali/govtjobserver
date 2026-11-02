import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('authors')
@Controller('authors')
export class AuthorsController {
  constructor(private svc: AuthorsService) {}
  @Get() list() { return this.svc.list(true); }
  @Get(':slug') one(@Param('slug') slug: string) { return this.svc.bySlug(slug); }
  @Get(':slug/jobs') jobs(@Param('slug') slug: string, @Query() q: any) { return this.svc.jobsBySlug(slug, q); }
}

@ApiTags('admin-authors')
@Controller('admin/authors')
@UseGuards(AuthGuard)
export class AuthorsAdminController {
  constructor(private svc: AuthorsService) {}
  @Get() list() { return this.svc.list(false); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
