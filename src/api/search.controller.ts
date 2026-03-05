import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../brain-core/search.service';
import { toErrorMessage } from '../common/error.util';
import type { Memory, MemoryScope } from '../brain-schema';

const DEFAULT_LIMIT = 10;

function parseLimit(value: string | undefined, fallback = DEFAULT_LIMIT): number {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

@Controller('brain')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('memory/search')
  async search(
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('scope') scope?: MemoryScope,
  ): Promise<{ results: Memory[]; error?: string }> {
    try {
      const results = await this.searchService.search(
        q ?? '',
        parseLimit(limit),
        scope,
      );
      return { results };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/memory/search]', message);
      return { results: [], error: message };
    }
  }

  @Get('photos/search')
  async searchPhotos(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<{ results: Memory[]; error?: string }> {
    try {
      const results = await this.searchService.searchPhotos(
        q ?? '',
        parseLimit(limit),
      );
      return { results };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/photos/search]', message);
      return { results: [], error: message };
    }
  }

  @Get('documents/search')
  async searchDocuments(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<{ results: Memory[]; error?: string }> {
    try {
      const results = await this.searchService.searchDocuments(
        q ?? '',
        parseLimit(limit),
      );
      return { results };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/documents/search]', message);
      return { results: [], error: message };
    }
  }
}
