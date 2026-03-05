import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  return app;
}

export async function bootstrap() {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3001);
  return app;
}
