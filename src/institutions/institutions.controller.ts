import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private svc: InstitutionsService) {}
  @Get() list(@Query() q: any) { return this.svc.list({ ...q, public: '1' }); }
  @Get(':slug') one(@Param('slug') slug: string) { return this.svc.bySlug(slug); }
  @Get(':slug/jobs') jobs(@Param('slug') slug: string, @Query() q: any) { return this.svc.jobsBySlug(slug, q); }
}

@ApiTags('admin-institutions')
@Controller('admin/institutions')
@UseGuards(AuthGuard)
export class InstitutionsAdminController {
  constructor(private svc: InstitutionsService) {}
  @Get() list(@Query() q: any) { return this.svc.list(q); }
  @Post() create(@Body() dto: any) { return this.svc.create(dto); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
