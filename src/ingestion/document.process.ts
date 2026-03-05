import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { extractTextFromPDF } from '../vision/pdf.ocr';
import { extractTextFromDocx } from '../vision/docx.ocr';
import { MemoryService } from '../brain-core/memory.service';

const DOC_EXT = {
  pdf: (p: string) => extractTextFromPDF(p),
  docx: (p: string) => extractTextFromDocx(p),
  txt: async (p: string) => (await fs.readFile(p, 'utf-8')).trim(),
  md: async (p: string) => (await fs.readFile(p, 'utf-8')).trim(),
};

export interface ProcessDocumentResult {
  memoryId: string;
  contentLength: number;
}

/**
 * Document pipeline: extract text (PDF/DOCX/TXT/MD) → store as Memory (embed + Qdrant + Mongo).
 */
@Injectable()
export class DocumentProcessService {
  constructor(private readonly memory: MemoryService) {}

  async processDocument(
    filePath: string,
    scope: 'personal' | 'family',
  ): Promise<ProcessDocumentResult | null> {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const extract = DOC_EXT[ext as keyof typeof DOC_EXT];
    if (!extract) return null;

    let content: string;
    try {
      content = await extract(filePath);
    } catch {
      return null;
    }
    if (!content || content.length < 2) return null;

    const memory = await this.memory.store(content.slice(0, 100_000), {
      type: 'document',
      scope,
      metadata: { filePath },
    });
    return { memoryId: memory.id, contentLength: content.length };
  }
}
