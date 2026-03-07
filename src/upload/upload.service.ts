import { BadRequestException, Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { STORAGE_CONFIG, S3_REF_PREFIX } from '../config/storage.config';
import {
  PHOTO_EXT_REGEX,
  DOCUMENT_EXT_REGEX,
  ALLOWED_DOC_EXT_MSG,
} from '../common/constants';
import { S3Service } from '../storage/s3.service';

export interface SaveFileResult {
  /** 로컬 경로 (처리용). S3 사용 시 임시 파일 경로. */
  pathForProcessing: string;
  /** 메모리 메타데이터에 저장할 값. 로컬이면 경로, S3면 s3:key */
  filePathForMetadata: string;
}

@Injectable()
export class UploadService {
  constructor(private readonly s3: S3Service) {}

  /**
   * 업로드 파일 저장. S3_BUCKET 설정 시 S3에 올리고, 아니면 로컬 brain-data에 저장.
   * 처리(EXIF/Vision/텍스트 추출)는 pathForProcessing(로컬 경로)로 수행.
   */
  async saveFile(
    buffer: Buffer,
    originalname: string,
    type: 'photo' | 'document',
  ): Promise<SaveFileResult> {
    const ext = path.extname(originalname) || (type === 'photo' ? '.jpg' : '.txt');
    if (type === 'document' && !DOCUMENT_EXT_REGEX.test(ext)) {
      throw new BadRequestException(
        `지원하지 않는 문서 형식입니다. ${ALLOWED_DOC_EXT_MSG}`,
      );
    }
    const safeExt =
      type === 'photo' && PHOTO_EXT_REGEX.test(ext)
        ? ext
        : type === 'document'
          ? ext
          : type === 'photo'
            ? '.jpg'
            : '.txt';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;

    if (STORAGE_CONFIG.useS3) {
      const key = type === 'photo' ? `personal/photos/${name}` : `personal/documents/${name}`;
      const tmpPath = path.join(os.tmpdir(), `custom-brain-upload-${name}`);
      await fs.writeFile(tmpPath, buffer);
      const uploaded = await this.s3.upload(buffer, key, type === 'photo' ? 'image/jpeg' : undefined);
      if (uploaded) {
        return {
          pathForProcessing: tmpPath,
          filePathForMetadata: S3_REF_PREFIX + key,
        };
      }
      await fs.unlink(tmpPath).catch(() => {});
      // S3 실패 시 로컬로 fallback
    }

    const dir = type === 'photo' ? STORAGE_CONFIG.personal.photos : STORAGE_CONFIG.personal.documents;
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, name);
    await fs.writeFile(filePath, buffer);
    return { pathForProcessing: filePath, filePathForMetadata: filePath };
  }

  /** S3 업로드 시 사용한 임시 파일 삭제 (pathForProcessing이 temp인 경우만 호출) */
  async cleanupTempPath(localPath: string): Promise<void> {
    if (!localPath || !localPath.includes(os.tmpdir())) return;
    try {
      await fs.unlink(localPath);
    } catch {
      // ignore
    }
  }
}
