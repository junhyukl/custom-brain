import { Injectable } from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';

export interface SearchPhotosToolInput {
  query: string;
  limit?: number;
}

@Injectable()
export class SearchPhotosTool {
  name = 'search_photos';
  description = 'Search photos and documents by semantic query (e.g. "2015 family trip")';

  constructor(private readonly memory: MemoryService) {}

  async execute(input: SearchPhotosToolInput): Promise<{ id: string; content: string }[]> {
    const results = await this.memory.searchPhotos(input.query, input.limit ?? 10);
    return results.map((m) => ({ id: m.id, content: m.content }));
  }
}
