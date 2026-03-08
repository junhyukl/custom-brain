import { Test, TestingModule } from '@nestjs/testing';
import { MemoryService } from './memory.service';
import { MongoService } from '../mongo/mongo.service';
import { VectorStore } from '../vector/vectorStore';
import { EmbeddingService } from '../brain-core/embedding.service';
import { S3Service } from '../storage/s3.service';

describe('MemoryService', () => {
  let service: MemoryService;
  let mockMongo: { getMemoryCollection: jest.Mock };
  let mockVector: jest.Mocked<Pick<VectorStore, 'ensureCollection' | 'upsert' | 'search' | 'delete' | 'deleteCollection'>>;
  let mockEmbedding: jest.Mocked<Pick<EmbeddingService, 'embed'>>;

  beforeEach(async () => {
    const mockCol = {
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    };
    mockMongo = { getMemoryCollection: jest.fn(() => mockCol) };

    mockVector = {
      ensureCollection: jest.fn().mockResolvedValue(undefined),
      upsert: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteCollection: jest.fn().mockResolvedValue(undefined),
    };

    mockEmbedding = { embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]) };

    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        { provide: MongoService, useValue: mockMongo },
        { provide: VectorStore, useValue: mockVector },
        { provide: EmbeddingService, useValue: mockEmbedding },
        { provide: S3Service, useValue: { deleteObject: jest.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = mod.get(MemoryService);
  });

  describe('store', () => {
    it('embeds content, inserts into mongo and vector', async () => {
      const mem = await service.store('Hello world', { type: 'note' });

      expect(mockEmbedding.embed).toHaveBeenCalledWith('Hello world');
      expect(mockMongo.getMemoryCollection().insertOne).toHaveBeenCalled();
      expect(mockVector.upsert).toHaveBeenCalled();
      expect(mem.content).toBe('Hello world');
      expect(mem.type).toBe('note');
      expect(mem.scope).toBe('personal');
    });
  });

  describe('storeWithVector', () => {
    it('skips embedding and uses provided vector', async () => {
      const vec = [1, 2, 3];
      const mem = await service.storeWithVector('Caption', vec, { type: 'photo' });

      expect(mockEmbedding.embed).not.toHaveBeenCalled();
      expect(mockVector.upsert).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.objectContaining({ vector: vec })]),
      );
      expect(mem.content).toBe('Caption');
      expect(mem.type).toBe('photo');
    });
  });

  describe('getById', () => {
    it('returns null when not found', async () => {
      const out = await service.getById('missing');
      expect(out).toBeNull();
    });

    it('returns doc when found', async () => {
      const doc = { id: '1', content: 'x', type: 'note', scope: 'personal', metadata: {}, createdAt: new Date() };
      mockMongo.getMemoryCollection().findOne.mockResolvedValueOnce(doc);

      const out = await service.getById('1');
      expect(out).toEqual(doc);
    });
  });

  describe('search', () => {
    it('returns [] for empty query', async () => {
      const results = await service.search('', 5);
      expect(results).toEqual([]);
      expect(mockEmbedding.embed).not.toHaveBeenCalled();
    });

    it('embeds query and returns memories from vector search with scoreThreshold', async () => {
      mockVector.search.mockResolvedValueOnce([{ id: '1' }]);
      mockMongo.getMemoryCollection().find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          { id: '1', content: 'a', type: 'note', scope: 'personal', metadata: {}, createdAt: new Date() },
        ]),
      });

      const results = await service.search('query', 5);
      expect(mockEmbedding.embed).toHaveBeenCalledWith('query');
      expect(mockVector.search).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        5,
        expect.objectContaining({ scoreThreshold: expect.any(Number) }),
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });
  });

  describe('searchPhotos', () => {
    it('returns [] for empty query', async () => {
      const results = await service.searchPhotos('', 10);
      expect(results).toEqual([]);
      expect(mockVector.search).not.toHaveBeenCalled();
    });

    it('searches with payloadType photo and scoreThreshold, returns photo memories', async () => {
      mockVector.search.mockResolvedValueOnce([{ id: '1' }]);
      mockMongo.getMemoryCollection().find.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          { id: '1', content: 'photo caption', type: 'photo', scope: 'personal', metadata: {}, createdAt: new Date() },
        ]),
      });

      const results = await service.searchPhotos('beach', 10);
      expect(mockVector.search).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        10,
        expect.objectContaining({ payloadType: 'photo', scoreThreshold: expect.any(Number) }),
      );
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('photo');
      expect(results[0].id).toBe('1');
    });
  });
});
