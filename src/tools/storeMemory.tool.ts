import { Injectable } from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';

export interface StoreMemoryToolInput {
  content: string;
  type?: 'note' | 'document' | 'photo' | 'event' | 'conversation';
  scope?: 'personal' | 'family';
}

@Injectable()
export class StoreMemoryTool {
  name = 'store_memory';
  description = 'Store a memory for later retrieval (vector index + metadata)';

  constructor(private readonly memory: MemoryService) {}

  async execute(input: StoreMemoryToolInput): Promise<{ stored: boolean; id: string }> {
    const m = await this.memory.store(input.content, {
      type: input.type,
      scope: input.scope,
    });
    return { stored: true, id: m.id };
  }
}
