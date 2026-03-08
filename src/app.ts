import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { STORAGE_CONFIG } from './config/storage.config';
import { GlobalExceptionFilter } from './common/http-exception.filter';

const DEFAULT_PORT = 3001;

function validateEnv(): void {
  const port = process.env.PORT ?? String(DEFAULT_PORT);
  const n = parseInt(port, 10);
  if (Number.isNaN(n) || n < 1 || n > 65535) {
    throw new Error(`Invalid PORT: ${port}. Use 1-65535.`);
  }
}

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new GlobalExceptionFilter());
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors(
    corsOrigin
      ? { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }
      : undefined,
  );
  app.useStaticAssets(STORAGE_CONFIG.root, { prefix: '/brain-data' });
  return app;
}

export async function bootstrap() {
  validateEnv();
  const app = await createApp();
  const port = parseInt(process.env.PORT ?? String(DEFAULT_PORT), 10);
  const logger = new Logger('Bootstrap');
  try {
    await app.listen(port);
    logger.log(`Application listening on port ${port}`);
    return app;
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'EADDRINUSE') {
      logger.warn(`Port ${port} is already in use. Skipping listen.`);
      process.exit(0);
    }
    throw err;
  }
}
