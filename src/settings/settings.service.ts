import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}
  async publicSettings() {
    const rows = await this.prisma.siteSetting.findMany();
    const obj: any = {};
    rows.forEach((r) => (obj[r.key] = r.value));
    return obj;
  }
  adminSettings() { return this.prisma.siteSetting.findMany({ orderBy: { key: 'asc' } }); }
  async saveAll(input: Record<string, string>) {
    const keys = Object.keys(input || {});
    await this.prisma.$transaction(keys.map((k) => this.prisma.siteSetting.upsert({ where: { key: k }, create: { key: k, value: String(input[k] ?? '') }, update: { value: String(input[k] ?? '') } })));
    return this.publicSettings();
  }
  globalSeo() { return this.prisma.seoMetadata.findUnique({ where: { scope: 'global' } }); }
  async saveGlobalSeo(data: any) {
    return this.prisma.seoMetadata.upsert({ where: { scope: 'global' }, create: { scope: 'global', ...data }, update: { ...data } });
  }
}
