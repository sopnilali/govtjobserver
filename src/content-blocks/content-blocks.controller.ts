import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContentBlocksService } from './content-blocks.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('admin-content')
@Controller('admin')
@UseGuards(AuthGuard)
export class ContentBlocksController {
  constructor(private svc: ContentBlocksService) {}
  @Get('jobs/:jobId/content-blocks') list(@Param('jobId', ParseIntPipe) jobId: number) { return this.svc.list(jobId); }
  @Post('jobs/:jobId/content-blocks') create(@Param('jobId', ParseIntPipe) jobId: number, @Body() dto: any) { return this.svc.create(jobId, dto); }
  @Put('content-blocks/:id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete('content-blocks/:id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
  @Patch('jobs/:jobId/content-blocks/reorder') reorder(@Param('jobId', ParseIntPipe) jobId: number, @Body() b: any) { return this.svc.reorder(jobId, b.items || []); }
}
