/**
 * Personal + Family AI Memory Pipeline: 통합 ingestion
 * 사진 (Vision + 얼굴) + 문서 (PDF/DOCX/TXT/MD) → 벡터화 → Qdrant + Memory
 *
 * 사용법: pnpm run ingest-all
 *
 * 폴더 구조:
 *   brain-data/personal/  (notes, documents, photos, projects)
 *   brain-data/family/   (photos, documents, history, faces.json)
 */
import fs from 'fs';
import path from 'path';
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

interface IngestStats {
  photos: number;
  documents: number;
  skip: number;
  err: number;
}

async function scanFolder(
  folder: string,
  scope: 'personal' | 'family',
  photoProcess: PhotoProcessService,
  documentProcess: DocumentProcessService,
  stats: IngestStats,
): Promise<void> {
  if (!fs.existsSync(folder)) return;

  const entries = fs.readdirSync(folder, { withFileTypes: true });

  for (const e of entries) {
    const fullPath = path.join(folder, e.name);

    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith('.')) {
        stats.skip += 1;
        continue;
      }
      await scanFolder(fullPath, scope, photoProcess, documentProcess, stats);
      continue;
    }

    if (!e.isFile()) {
      stats.skip += 1;
      continue;
    }

    if (PHOTO_EXT_REGEX.test(e.name)) {
      try {
        console.log('Processing', fullPath);
        const result = await photoProcess.processPhoto(fullPath, scope);
        console.log(
          `  -> ${result.memoryId} (${result.faces.length} faces: ${result.faces.map((f) => f.name).join(', ')})`,
        );
        stats.photos += 1;
      } catch (err) {
        console.error('Error', fullPath, err);
        stats.err += 1;
      }
      continue;
    }

    if (DOCUMENT_EXT_REGEX.test(e.name)) {
      try {
        console.log('Document', fullPath);
        const result = await documentProcess.processDocument(fullPath, scope);
        if (result) {
          console.log(`  -> ${result.memoryId} (${result.contentLength} chars)`);
          stats.documents += 1;
        } else {
          stats.skip += 1;
        }
      } catch (err) {
        console.error('Error', fullPath, err);
        stats.err += 1;
      }
    }
  }
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const photoProcess = app.get(PhotoProcessService);
  const documentProcess = app.get(DocumentProcessService);

  const stats: IngestStats = { photos: 0, documents: 0, skip: 0, err: 0 };

  for (const { path: dir, scope } of DATA_DIRS) {
    const absDir = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
    console.log(`\n[${scope}] ${absDir}`);
    await scanFolder(absDir, scope, photoProcess, documentProcess, stats);
  }

  await app.close();
  console.log('\nAll data ingested!', stats);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
