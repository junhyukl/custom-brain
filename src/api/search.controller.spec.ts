import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from '../brain-core/search.service';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: jest.Mocked<Pick<SearchService, 'search' | 'searchPhotos' | 'searchDocuments'>>;

  beforeEach(async () => {
    searchService = {
      search: jest.fn().mockResolvedValue([]),
      searchPhotos: jest.fn().mockResolvedValue([]),
      searchDocuments: jest.fn().mockResolvedValue([]),
    };

    const mod: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: searchService }],
    }).compile();

    controller = mod.get(SearchController);
  });

  it('GET memory/search delegates to searchService.search', async () => {
    const results = await controller.search('q', '5');
    expect(searchService.search).toHaveBeenCalledWith('q', 5, undefined);
    expect(results.results).toEqual([]);
  });

  it('POST search delegates to searchService.search with body', async () => {
    const results = await controller.searchPost({ query: '할아버지', limit: 10 });
    expect(searchService.search).toHaveBeenCalledWith('할아버지', 10);
    expect(results.results).toEqual([]);
  });

  it('GET photos/search delegates to searchService.searchPhotos', async () => {
    await controller.searchPhotos('beach', '8');
    expect(searchService.searchPhotos).toHaveBeenCalledWith('beach', 8);
  });

  it('GET documents/search delegates to searchService.searchDocuments', async () => {
    await controller.searchDocuments('report', '3');
    expect(searchService.searchDocuments).toHaveBeenCalledWith('report', 3);
  });
});
