import { Test, TestingModule } from '@nestjs/testing';
import { MemoryService } from './memory.service';
import { EmbeddingService } from './embedding.service';
import { VectorStore } from '../vector/vectorStore';

describe('MemoryService', () => {
  let service: MemoryService;
  let embedding: jest.Mocked<Pick<EmbeddingService, 'embed'>>;
  let vectorStore: jest.Mocked<Pick<VectorStore, 'ensureCollection' | 'search' | 'upsert'>>;

  beforeEach(async () => {
    embedding = { embed: jest.fn().mockResolvedValue([0.1, 0.2]) };
    vectorStore = {
      ensureCollection: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([{ payload: { text: 'hit', source: 'test' } }]),
      upsert: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        { provide: EmbeddingService, useValue: embedding },
        { provide: VectorStore, useValue: vectorStore },
      ],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('recall returns array', async () => {
    const result = await service.recall();
    expect(Array.isArray(result)).toBe(true);
  });

  it('search embeds query and returns vector search results', async () => {
    const result = await service.search('any query');
    expect(embedding.embed).toHaveBeenCalledWith('any query');
    expect(vectorStore.search).toHaveBeenCalled();
    expect(result).toEqual([{ text: 'hit', source: 'test' }]);
  });

  it('search returns empty array when embed returns empty', async () => {
    embedding.embed.mockResolvedValueOnce([]);
    const result = await service.search('empty');
    expect(result).toEqual([]);
  });

  it('store embeds text and upserts with payload', async () => {
    await service.store('some text');
    expect(embedding.embed).toHaveBeenCalledWith('some text');
    expect(vectorStore.upsert).toHaveBeenCalled();
    const [coll, points] = vectorStore.upsert.mock.calls[0];
    expect(coll).toBe('memory');
    expect(points[0].payload).toMatchObject({ text: 'some text' });
  });

  it('store with metadata passes options into payload', async () => {
    await service.store('text', { source: 'test', person: 'grandfather' });
    const [, points] = vectorStore.upsert.mock.calls[0];
    expect(points[0].payload).toMatchObject({
      text: 'text',
      source: 'test',
      person: 'grandfather',
    });
  });
});
