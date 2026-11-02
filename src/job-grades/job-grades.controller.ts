import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard';
import { JobGradesService } from './job-grades.service';

class GradeDto {
  @IsString() name: string;
  @IsOptional() @IsString() label?: string;
  @IsString() code: string;
  @IsOptional() @IsInt() salaryMin?: number;
  @IsOptional() @IsInt() salaryMax?: number;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('job-grades')
@Controller('job-grades')
export class JobGradesPublicController {
  constructor(private svc: JobGradesService) {}
  @Get() list() { return this.svc.listPublic(); }
}

@ApiTags('admin-job-grades')
@Controller('admin/job-grades')
@UseGuards(AuthGuard)
export class JobGradesAdminController {
  constructor(private svc: JobGradesService) {}
  @Get() list() { return this.svc.listAdmin(); }
  @Post() create(@Body() dto: GradeDto) { return this.svc.create(dto); }
  @Get(':id') get(@Param('id', ParseIntPipe) id: number) { return this.svc.get(id); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: GradeDto) { return this.svc.update(id, dto); }
  @Patch('reorder') reorder(@Body() body: { items: { id: number; sortOrder: number }[] }) { return this.svc.reorder(body.items || []); }
  @Patch(':id/status') status(@Param('id', ParseIntPipe) id: number, @Body() b: { isActive: boolean }) { return this.svc.setStatus(id, !!b.isActive); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
