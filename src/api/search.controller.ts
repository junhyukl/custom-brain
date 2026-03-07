import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SearchService } from '../brain-core/search.service';
import { toErrorMessage } from '../common/error.util';
import { DEFAULT_SEARCH_LIMIT, parseLimit } from '../common/constants';
import type { Memory, MemoryScope } from '../schemas';

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

  /** v2: POST 검색 (쿼리 임베딩 후 벡터 검색). body: { query: string, limit?: number } */
  @Post('search')
  async searchPost(
    @Body() body: { query?: string; limit?: number },
  ): Promise<{ results: Memory[]; error?: string }> {
    return this.handleSearch('brain/search', () =>
      this.searchService.search(
        body.query ?? '',
        parseLimit(String(body.limit), DEFAULT_SEARCH_LIMIT),
      ),
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
