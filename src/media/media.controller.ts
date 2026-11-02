import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('admin-uploads')
@Controller('admin/uploads')
@UseGuards(AuthGuard)
export class MediaController {
  constructor(private svc: MediaService) {}
  @Get() list() { return this.svc.list(); }
  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } }))
  upload(@UploadedFile() file: Express.Multer.File, @Body() b: any) { return this.svc.saveFile(file, b.kind || 'other'); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
