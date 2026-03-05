import { Injectable } from '@nestjs/common';

export interface SearchMemoryToolInput {
  query: string;
  limit?: number;
}

@Injectable()
export class SearchMemoryTool {
  name = 'search_memory';
  description = 'Search stored memories by query';

  async execute(input: SearchMemoryToolInput): Promise<unknown[]> {
    // TODO: inject MemoryService or VectorStore and perform search
    return [];
  }
}
