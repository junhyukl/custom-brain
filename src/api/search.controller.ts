import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../brain-core/search.service';
import { toErrorMessage } from '../common/error.util';
import { DEFAULT_SEARCH_LIMIT, parseLimit } from '../common/constants';
import type { Memory, MemoryScope } from '../brain-schema';

@Controller('brain')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  private async handleSearch(
    tag: string,
    fn: () => Promise<Memory[]>,
  ): Promise<{ results: Memory[]; error?: string }> {
    try {
      const results = await fn();
      return { results };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error(`[${tag}]`, message);
      return { results: [], error: message };
    }
  }

  @Get('memory/search')
  async search(
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('scope') scope?: MemoryScope,
  ): Promise<{ results: Memory[]; error?: string }> {
    return this.handleSearch('brain/memory/search', () =>
      this.searchService.search(q ?? '', parseLimit(limit, DEFAULT_SEARCH_LIMIT), scope),
    );
  }

  @Get('photos/search')
  async searchPhotos(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<{ results: Memory[]; error?: string }> {
    return this.handleSearch('brain/photos/search', () =>
      this.searchService.searchPhotos(q ?? '', parseLimit(limit, DEFAULT_SEARCH_LIMIT)),
    );
  }

  @Get('documents/search')
  async searchDocuments(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<{ results: Memory[]; error?: string }> {
    return this.handleSearch('brain/documents/search', () =>
      this.searchService.searchDocuments(q ?? '', parseLimit(limit, DEFAULT_SEARCH_LIMIT)),
    );
  }
}
