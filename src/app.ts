import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'node:path';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

export async function createApp() {
  const server = express();
  const publicDir = join(process.cwd(), 'public');
  server.use(express.static(publicDir));

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors();
  return app;
}

export async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3001);
  return app;
}
