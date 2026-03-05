import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { STORAGE_CONFIG } from './config/storage.config';

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  // 웹/모바일 UI에서 사진 접근: /brain-data/... → brain-data 디렉터리
  app.useStaticAssets(STORAGE_CONFIG.root, { prefix: '/brain-data' });
  return app;
}

export async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3001);
  return app;
}
