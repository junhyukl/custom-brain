import { Injectable } from '@nestjs/common';

/** Placeholder for OCR (e.g. extract text from document images). */
@Injectable()
export class OcrService {
  async extractText(_imageBase64OrPath: string): Promise<string> {
    return '';
  }
}
