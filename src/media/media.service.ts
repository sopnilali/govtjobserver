import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.svg']);
const BLOCKED = new Set(['.exe', '.js', '.sh', '.bat', '.cmd', '.php']);

function s3Enabled(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    (process.env.AWS_ENDPOINT_URL_S3 || process.env.AWS_ENDPOINT_URL),
  );
}

function s3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION || 'auto',
    endpoint: process.env.AWS_ENDPOINT_URL_S3 || process.env.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  });
}

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}
  list() { return this.prisma.media.findMany({ orderBy: { id: 'desc' }, take: 200 }); }

  async saveFile(file: Express.Multer.File, kind = 'other') {
    if (!file) throw new BadRequestException('No file uploaded');
    const ext = extname(file.originalname).toLowerCase();
    if (BLOCKED.has(ext)) throw new BadRequestException('File type not allowed');
    if (!ALLOWED.has(ext)) throw new BadRequestException(`Allowed: ${[...ALLOWED].join(', ')}`);
    const maxMb = Number(process.env.MAX_FILE_SIZE_MB || 10);
    if (file.size > maxMb * 1024 * 1024) throw new BadRequestException(`File too large (max ${maxMb}MB)`);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    // Prefer S3-compatible object storage when configured, else local disk.
    if (s3Enabled()) {
      const bucket = process.env.S3_BUCKET as string;
      const key = `uploads/${name}`;
      await s3Client().send(new PutObjectCommand({
        Bucket: bucket, Key: key, Body: file.buffer,
        ContentType: file.mimetype, ContentLength: file.size,
      }));
      const endpoint = (process.env.AWS_ENDPOINT_URL_S3 || process.env.AWS_ENDPOINT_URL || '').replace(/\/$/, '');
      const url = `${endpoint}/${bucket}/${key}`;
      return this.prisma.media.create({ data: { filename: file.originalname, url, mimeType: file.mimetype, size: file.size, kind: `s3:${kind}` } });
    }
    const dir = join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, name), file.buffer);
    const url = `/uploads/${name}`;
    return this.prisma.media.create({ data: { filename: file.originalname, url, mimeType: file.mimetype, size: file.size, kind } });
  }

  async remove(id: number) {
    const m = await this.prisma.media.findUnique({ where: { id } });
    if (!m) return { message: 'Already deleted' };
    try {
      if (m.kind?.startsWith('s3:') && s3Enabled()) {
        const bucket = process.env.S3_BUCKET as string;
        const marker = `/${bucket}/`;
        const key = m.url.includes(marker) ? m.url.split(marker)[1] : m.url.split('/').slice(-2).join('/');
        await s3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      } else {
        const p = join(process.cwd(), m.url.replace(/^\//, ''));
        if (existsSync(p)) unlinkSync(p);
      }
    } catch {}
    await this.prisma.media.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
