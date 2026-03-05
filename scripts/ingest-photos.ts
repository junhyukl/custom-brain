/**
 * Photo + Face Ingestion: personal & family 폴더 스캔
 * → 얼굴 인식 & 태깅 → Vision 설명 → embedding → Qdrant + Memory
 *
 * 사용법:
 *   pnpm run ingest-photos
 *
 * 폴더 구조:
 *   brain-data/personal/photos/  (projects/, notes/, work1.jpg ...)
 *   brain-data/family/photos/    (2015_korea_trip/, grandfather/, birthday2019.jpg)
 */
import fs from 'fs';
import path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PhotoProcessService } from '../src/ingestion/photo.process';
import { STORAGE_CONFIG } from '../src/config/storage.config';
import { PHOTO_EXT_REGEX } from '../src/common/constants';

const PHOTO_DIRS: { dir: string; scope: 'personal' | 'family' }[] = [
  { dir: STORAGE_CONFIG.personal.photos, scope: 'personal' },
  { dir: STORAGE_CONFIG.family.photos, scope: 'family' },
];

async function scanFolder(
  folder: string,
  processPhoto: PhotoProcessService,
  scope: 'personal' | 'family',
): Promise<{ done: number; skip: number; err: number }> {
  let done = 0;
  let skip = 0;
  let err = 0;

  if (!fs.existsSync(folder)) {
    return { done: 0, skip: 0, err: 0 };
  }

  const entries = fs.readdirSync(folder, { withFileTypes: true });

  for (const e of entries) {
    const fullPath = path.join(folder, e.name);

    if (e.isDirectory() && !e.name.startsWith('.')) {
      const sub = await scanFolder(fullPath, processPhoto, scope);
      done += sub.done;
      skip += sub.skip;
      err += sub.err;
      continue;
    }

    if (!e.isFile()) {
      skip += 1;
      continue;
    }

    if (!PHOTO_EXT_REGEX.test(e.name)) {
      skip += 1;
      continue;
    }

    try {
      console.log('processing', fullPath);
      const result = await processPhoto.processPhoto(fullPath, scope);
      console.log(
        `  -> ${result.memoryId} (${result.faces.length} faces: ${result.faces.map((f) => f.name).join(', ')})`,
      );
      done += 1;
    } catch (e) {
      console.error('error', fullPath, e);
      err += 1;
    }
  }

  return { done, skip, err };
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const processPhoto = app.get(PhotoProcessService);

  let totalDone = 0;
  let totalSkip = 0;
  let totalErr = 0;

  for (const { dir, scope } of PHOTO_DIRS) {
    const absDir = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
    console.log(`\n[${scope}] ${absDir}`);
    const { done, skip, err } = await scanFolder(absDir, processPhoto, scope);
    totalDone += done;
    totalSkip += skip;
    totalErr += err;
  }

  await app.close();
  console.log('\nDone.', { done: totalDone, skip: totalSkip, err: totalErr });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
