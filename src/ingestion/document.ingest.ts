import { Injectable } from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';

@Injectable()
export class DocumentIngestService {
  constructor(private readonly memory: MemoryService) {}

  /**
   * Ingest text document: store as memory (type: document).
   * For PDF/binary, extract text first (e.g. via OcrService or pdf-parse) then call this.
   */
  async ingestDocument(
    content: string,
    options?: { filePath?: string; scope?: 'personal' | 'family'; date?: string },
  ): Promise<{ memoryId: string }> {
    const memory = await this.memory.store(content, {
      type: 'document',
      scope: options?.scope ?? 'personal',
      metadata: { filePath: options?.filePath, date: options?.date },
    });
    return { memoryId: memory.id };
  }
}
