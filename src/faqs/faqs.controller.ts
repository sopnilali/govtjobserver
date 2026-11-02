import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('faqs')
@Controller()
export class FaqsController {
  constructor(private svc: FaqsService) {}
  @Get('faqs') list(@Query('jobId') jobId?: string) { return this.svc.list(jobId ? Number(jobId) : undefined); }
  @UseGuards(AuthGuard)
  @Post('admin/faqs') create(@Body() dto: any) { return this.svc.create(dto); }
  @UseGuards(AuthGuard)
  @Put('admin/faqs/:id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) { return this.svc.update(id, dto); }
  @UseGuards(AuthGuard)
  @Delete('admin/faqs/:id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
