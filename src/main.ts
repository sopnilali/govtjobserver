import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const prefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(prefix, { exclude: ['/', '/admin', '/admin/(.*)', '/sitemap.xml', '/robots.txt', '/uploads/(.*)'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());
  const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : true, credentials: true });
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const config = new DocumentBuilder()
    .setTitle('BD Govt Jobs Portal API')
    .setDescription('REST API for Bangladesh Government Jobs Portal')
    .setVersion('1.0')
    .addCookieAuth(process.env.COOKIE_NAME || 'bdjobs_token')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port} | API /${prefix} | Docs /api/docs`);
}
bootstrap();
