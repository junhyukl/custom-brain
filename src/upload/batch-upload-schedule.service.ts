import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import fs from 'fs/promises';
import path from 'path';
import { STORAGE_CONFIG } from '../config/storage.config';
import { PHOTO_EXT_REGEX, DOCUMENT_EXT_REGEX } from '../common/constants';
import { UploadService } from './upload.service';
import { PhotoProcessService } from '../ingestion/photo.process';
import { DocumentProcessService } from '../ingestion/document.process';
import { toErrorMessage } from '../common/error.util';

const PROCESSED_SUBDIR = 'processed';

@Injectable()
export class BatchUploadScheduleService {
  constructor(
    private readonly upload: UploadService,
    private readonly photoProcess: PhotoProcessService,
    private readonly documentProcess: DocumentProcessService,
  ) {}

  private getUploadDir(): string {
    return STORAGE_CONFIG.upload.dir;
  }

  private getProcessedDir(): string {
    return path.join(this.getUploadDir(), PROCESSED_SUBDIR);
  }

  private getType(filename: string): 'photo' | 'document' | null {
    if (PHOTO_EXT_REGEX.test(filename)) return 'photo';
    if (DOCUMENT_EXT_REGEX.test(filename)) return 'document';
    return null;
  }

  private async moveToProcessed(filePath: string): Promise<string> {
    const dir = this.getProcessedDir();
    await fs.mkdir(dir, { recursive: true });
    const base = path.basename(filePath);
    const ext = path.extname(base);
    const name = path.basename(base, ext);
    let dest = path.join(dir, base);
    let n = 0;
    while (true) {
      try {
        await fs.access(dest);
        n += 1;
        dest = path.join(dir, `${name}_${n}${ext}`);
      } catch {
        break;
      }
    }
    await fs.rename(filePath, dest);
    return dest;
  }

  /** 3분마다 실행: brain-data/upload 폴더 파일을 UI 업로드와 동일하게 처리 후 processed 로 이동 */
  @Cron('*/3 * * * *')
  async handleBatchUpload(): Promise<void> {
    const uploadDir = this.getUploadDir();
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch {
      return;
    }

    let entries: { name: string; isFile: () => boolean }[];
    try {
      entries = await fs.readdir(uploadDir, { withFileTypes: true });
    } catch {
      return;
    }

    const files = entries
      .filter((e) => e.isFile())
      .map((e) => path.join(uploadDir, e.name))
      .filter((p) => this.getType(path.basename(p)) !== null);

    if (files.length === 0) return;

    for (const filePath of files) {
      const name = path.basename(filePath);
      const type = this.getType(name)!;
      try {
        const buffer = await fs.readFile(filePath);
        const { pathForProcessing, filePathForMetadata } = await this.upload.saveFile(
          buffer,
          name,
          type,
        );
        try {
          if (type === 'photo') {
            await this.photoProcess.processPhoto(pathForProcessing, 'personal', {
              metadataFilePath: filePathForMetadata,
            });
          } else {
            await this.documentProcess.processDocument(pathForProcessing, 'personal', {
              metadataFilePath: filePathForMetadata,
            });
          }
        } finally {
          await this.upload.cleanupTempPath(pathForProcessing);
        }
        await this.moveToProcessed(filePath);
      } catch (err) {
        console.error('[batch-upload-schedule]', name, toErrorMessage(err));
      }
    }
  }
}
