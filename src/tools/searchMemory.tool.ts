import { Injectable } from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';

export interface SearchMemoryToolInput {
  query: string;
  limit?: number;
}

@Injectable()
export class SearchMemoryTool {
  name = 'search_memory';
  description = 'Search stored memories by semantic query (vector search)';

  constructor(private readonly memory: MemoryService) {}

  async execute(input: SearchMemoryToolInput): Promise<{ id: string; content: string; type: string }[]> {
    const results = await this.memory.search(input.query, input.limit ?? 10);
    return results.map((m) => ({ id: m.id, content: m.content, type: m.type }));
  }
}
