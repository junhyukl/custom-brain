import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MemoryService } from './memory.service';
import { FamilyMemoryService } from './familyMemory.service';

const FAMILY_TEXTS_FILE = 'family_texts.json';

export interface InitializeFamilyResult {
  textsLoaded: number;
  imagesAdded: number;
  documentsAdded: number;
  errors: Array<{ step: string; message: string }>;
}

@Injectable()
export class FamilyInitializeService {
  constructor(
    private readonly memory: MemoryService,
    private readonly familyMemory: FamilyMemoryService,
  ) {}

  /**
   * data/family_texts.json 로드 후 메모리에 저장,
   * data/images, data/documents 폴더를 addFamilyFolder로 일괄 등록.
   */
  async initializeFamilyBrain(): Promise<InitializeFamilyResult> {
    const result: InitializeFamilyResult = {
      textsLoaded: 0,
      imagesAdded: 0,
      documentsAdded: 0,
      errors: [],
    };
    const dataDir = join(process.cwd(), 'data');
    const textsPath = join(dataDir, FAMILY_TEXTS_FILE);

    if (existsSync(textsPath)) {
      try {
        const raw = readFileSync(textsPath, 'utf-8');
        const items = JSON.parse(raw) as Array<{ text: string; metadata?: Record<string, unknown> }>;
        for (const item of items) {
          if (item.text) {
            await this.memory.store(item.text, item.metadata ?? {});
            result.textsLoaded++;
          }
        }
      } catch (err) {
        result.errors.push({
          step: 'family_texts.json',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const imagesPath = join(dataDir, 'images');
    if (existsSync(imagesPath)) {
      try {
        const folderResult = await this.familyMemory.addFamilyFolder(imagesPath, 'all');
        result.imagesAdded = folderResult.added;
        folderResult.errors.forEach((e) =>
          result.errors.push({ step: 'images', message: `${e.file}: ${e.error}` }),
        );
      } catch (err) {
        result.errors.push({
          step: 'images',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const documentsPath = join(dataDir, 'documents');
    if (existsSync(documentsPath)) {
      try {
        const folderResult = await this.familyMemory.addFamilyFolder(documentsPath, 'all');
        result.documentsAdded = folderResult.added;
        folderResult.errors.forEach((e) =>
          result.errors.push({ step: 'documents', message: `${e.file}: ${e.error}` }),
        );
      } catch (err) {
        result.errors.push({
          step: 'documents',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return result;
  }
}
