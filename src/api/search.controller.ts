import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../brain-core/search.service';
import type { Memory, MemoryScope } from '../brain-schema';

@Controller('brain')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('memory/search')
  async search(
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('scope') scope?: MemoryScope,
  ): Promise<{ results: Memory[] }> {
    const results = await this.searchService.search(
      q ?? '',
      limit ? Number(limit) : 10,
      scope,
    );
    return { results };
  }

  @Get('photos/search')
  async searchPhotos(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<{ results: Memory[] }> {
    const results = await this.searchService.searchPhotos(
      q ?? '',
      limit ? Number(limit) : 10,
    );
    return { results };
  }

  @Get('documents/search')
  async searchDocuments(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ): Promise<{ results: Memory[] }> {
    const results = await this.searchService.searchDocuments(
      q ?? '',
      limit ? Number(limit) : 10,
    );
    return { results };
  }
}
