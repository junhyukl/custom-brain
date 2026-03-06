import { BadRequestException, Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { STORAGE_CONFIG } from '../config/storage.config';
import {
  PHOTO_EXT_REGEX,
  DOCUMENT_EXT_REGEX,
  ALLOWED_DOC_EXT_MSG,
} from '../common/constants';

@Injectable()
export class UploadService {
  /**
   * Save uploaded file to brain-data (personal) and return absolute path for processing.
   */
  async saveFile(
    buffer: Buffer,
    originalname: string,
    type: 'photo' | 'document',
  ): Promise<string> {
    const dir = type === 'photo' ? STORAGE_CONFIG.personal.photos : STORAGE_CONFIG.personal.documents;
    await fs.mkdir(dir, { recursive: true });

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
    const filePath = path.join(dir, name);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }
}
