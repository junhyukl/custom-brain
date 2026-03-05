/**
 * Photo Ingestion: 폴더 스캔 → Vision 설명 → embedding → Qdrant + Memory 저장
 *
 * 사용법:
 *   pnpm run ingest-photos
 *   PHOTO_DIR=./brain-data/family/photos pnpm run ingest-photos
 *
 * 폴더 구조 예:
 *   brain-data/family/photos/
 *     2015_korea_trip/IMG_001.jpg
 *     grandfather/birthday2019.jpg
 */
import fs from 'fs';
import path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ImageDescribeService } from '../src/vision/image.describe';
import { MemoryService } from '../src/brain-core/memory.service';
import { STORAGE_CONFIG } from '../src/config/storage.config';

const PHOTO_DIR = process.env.PHOTO_DIR ?? path.join(STORAGE_CONFIG.root, 'family', 'photos');
const PHOTO_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

async function ingestFolder(
  folder: string,
  describe: ImageDescribeService,
  memory: MemoryService,
): Promise<{ done: number; skip: number; err: number }> {
  let done = 0;
  let skip = 0;
  let err = 0;
  const entries = fs.readdirSync(folder, { withFileTypes: true });

  for (const e of entries) {
    const filePath = path.join(folder, e.name);
    const relPath = path.relative(PHOTO_DIR, filePath);

    if (e.isDirectory() && !e.name.startsWith('.')) {
      const sub = await ingestFolder(filePath, describe, memory);
      done += sub.done;
      skip += sub.skip;
      err += sub.err;
      continue;
    }

    if (!e.isFile()) {
      skip += 1;
      continue;
    }

    const ext = path.extname(e.name).toLowerCase();
    if (!PHOTO_EXT.includes(ext)) {
      skip += 1;
      continue;
    }

    try {
      console.log('processing', relPath);
      const description = await describe.describeFromPath(filePath, true);
      await memory.store(description, {
        type: 'photo',
        scope: 'family',
        metadata: { filePath: relPath },
      });
      done += 1;
    } catch (e) {
      console.error('error', relPath, e);
      err += 1;
    }
  }

  return { done, skip, err };
}

async function main() {
  const absDir = path.isAbsolute(PHOTO_DIR) ? PHOTO_DIR : path.join(process.cwd(), PHOTO_DIR);
  if (!fs.existsSync(absDir)) {
    console.error('Photo dir not found:', absDir);
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const describe = app.get(ImageDescribeService);
  const memory = app.get(MemoryService);

  console.log('Photo dir:', absDir);
  const { done, skip, err } = await ingestFolder(absDir, describe, memory);
  await app.close();

  console.log('Done.', { done, skip, err });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
