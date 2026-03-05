import { Injectable } from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';

@Injectable()
export class EmailIngestService {
  constructor(private readonly memory: MemoryService) {}

  /** Placeholder: ingest email content as memory (e.g. type: note, source: email). */
  async ingestEmail(
    content: string,
    options?: { subject?: string; date?: string },
  ): Promise<{ memoryId: string }> {
    const text = options?.subject ? `Subject: ${options.subject}\n\n${content}` : content;
    const memory = await this.memory.store(text, {
      type: 'note',
      metadata: { date: options?.date, source: 'email' },
    });
    return { memoryId: memory.id };
  }
}
