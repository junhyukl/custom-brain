import { Injectable } from '@nestjs/common';

export interface StoreMemoryToolInput {
  content: string;
}

@Injectable()
export class StoreMemoryTool {
  name = 'store_memory';
  description = 'Store a memory for later retrieval';

  async execute(input: StoreMemoryToolInput): Promise<{ stored: boolean }> {
    // TODO: inject MemoryService and store
    return { stored: true };
  }
}
