import { Injectable } from '@nestjs/common';
import { MemoryService } from './memory.service';
import type { Memory, MemoryScope } from '../brain-schema';

@Injectable()
export class SearchService {
  constructor(private readonly memory: MemoryService) {}

  async search(query: string, limit = 5, scope?: MemoryScope): Promise<Memory[]> {
    return this.memory.search(query, limit, scope);
  }

  async searchPhotos(query: string, limit = 10) {
    return this.memory.searchPhotos(query, limit);
  }

  async searchDocuments(query: string, limit = 10) {
    return this.memory.searchDocuments(query, limit);
  }
}
