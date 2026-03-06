import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { MemoryService } from './memory.service';

describe('SearchService', () => {
  let service: SearchService;
  let memory: jest.Mocked<Pick<MemoryService, 'search' | 'searchPhotos' | 'searchDocuments'>>;

  beforeEach(async () => {
    memory = {
      search: jest.fn().mockResolvedValue([]),
      searchPhotos: jest.fn().mockResolvedValue([]),
      searchDocuments: jest.fn().mockResolvedValue([]),
    };

    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: MemoryService, useValue: memory },
      ],
    }).compile();

    service = mod.get(SearchService);
  });

  it('search delegates to memory.search', async () => {
    const items = [{ id: '1', content: 'x', type: 'note', scope: 'personal', metadata: {}, createdAt: new Date() }];
    memory.search.mockResolvedValueOnce(items as never);

    const result = await service.search('query', 5);
    expect(memory.search).toHaveBeenCalledWith('query', 5, undefined);
    expect(result).toEqual(items);
  });

  it('searchPhotos delegates to memory.searchPhotos', async () => {
    await service.searchPhotos('beach', 10);
    expect(memory.searchPhotos).toHaveBeenCalledWith('beach', 10);
  });

  it('searchDocuments delegates to memory.searchDocuments', async () => {
    await service.searchDocuments('report', 8);
    expect(memory.searchDocuments).toHaveBeenCalledWith('report', 8);
  });
});
