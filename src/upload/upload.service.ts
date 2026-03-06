import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { STORAGE_CONFIG } from '../config/storage.config';

const PHOTO_EXT = /\.(jpg|jpeg|png|webp)$/i;
const DOC_EXT = /\.(pdf|docx|txt|md)$/i;

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
    const safeExt = type === 'photo' && PHOTO_EXT.test(ext) ? ext : type === 'document' && DOC_EXT.test(ext) ? ext : type === 'photo' ? '.jpg' : '.txt';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`;
    const filePath = path.join(dir, name);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }
}
