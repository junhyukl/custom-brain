/**
 * Full Personal + Family AI Pipeline — Parallel ingestion
 * 사진 10만 장 + 수천 문서를 WORKERS 수만큼 병렬 처리.
 *
 * 사용법: pnpm run ingest-all-parallel
 *
 * 1. 얼굴 DB: pnpm run build-face-db
 * 2. 병렬 수집: pnpm run ingest-all-parallel
 * 3. 타임라인 통계: pnpm run build-timeline
 */
import fs from 'fs';
import path from 'path';
import async from 'async';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PhotoProcessService } from '../src/ingestion/photo.process';
import { DocumentProcessService } from '../src/ingestion/document.process';
import { STORAGE_CONFIG } from '../src/config/storage.config';
import { PHOTO_EXT_REGEX, DOCUMENT_EXT_REGEX } from '../src/common/constants';

const DATA_DIRS: { path: string; scope: 'personal' | 'family' }[] = [
  { path: STORAGE_CONFIG.personal.notes, scope: 'personal' },
  { path: STORAGE_CONFIG.personal.documents, scope: 'personal' },
  { path: STORAGE_CONFIG.personal.photos, scope: 'personal' },
  { path: STORAGE_CONFIG.personal.projects, scope: 'personal' },
  { path: STORAGE_CONFIG.family.photos, scope: 'family' },
  { path: STORAGE_CONFIG.family.documents, scope: 'family' },
  { path: STORAGE_CONFIG.family.history, scope: 'family' },
];

const SKIP_DIRS = new Set(['faces_src', 'node_modules', '.git']);
const WORKERS = parseInt(process.env.INGEST_WORKERS ?? '10', 10);

interface Task {
  type: 'photo' | 'document';
  path: string;
  scope: 'personal' | 'family';
}

interface IngestStats {
  photos: number;
  documents: number;
  err: number;
}

function collectTasks(): Task[] {
  const tasks: Task[] = [];

  function walk(folder: string, scope: 'personal' | 'family') {
    if (!fs.existsSync(folder)) return;
    const entries = fs.readdirSync(folder, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(folder, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) continue;
        walk(fullPath, scope);
        continue;
      }
      if (!e.isFile()) continue;
      if (PHOTO_EXT_REGEX.test(e.name)) tasks.push({ type: 'photo', path: fullPath, scope });
      else if (DOCUMENT_EXT_REGEX.test(e.name)) tasks.push({ type: 'document', path: fullPath, scope });
    }
  }

  for (const { path: dir, scope } of DATA_DIRS) {
    const absDir = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
    walk(absDir, scope);
  }
  return tasks;
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const photoProcess = app.get(PhotoProcessService);
  const documentProcess = app.get(DocumentProcessService);

  const stats: IngestStats = { photos: 0, documents: 0, err: 0 };
  const tasks = collectTasks();
  console.log(`Enqueued ${tasks.length} tasks, workers=${WORKERS}`);

  const q = async.queue<Task>((task, callback) => {
    (async () => {
      try {
        if (task.type === 'photo') {
          await photoProcess.processPhoto(task.path, task.scope);
          stats.photos += 1;
          if (stats.photos % 100 === 0) console.log('Photos:', stats.photos);
        } else {
          const result = await documentProcess.processDocument(task.path, task.scope);
          if (result) stats.documents += 1;
        }
        callback();
      } catch (err) {
        stats.err += 1;
        console.error(task.type, task.path, err);
        callback();
      }
    })();
  }, WORKERS);

  await new Promise<void>((resolve) => {
    q.drain(() => resolve());
    tasks.forEach((t) => q.push(t));
  });

  await app.close();
  console.log('All personal and family data ingested in parallel!', stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
