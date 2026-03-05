import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { MemoryService } from '../src/brain/memory.service';
import { AskBrainService } from '../src/brain/askBrain.service';
import { MongoQueryService } from '../src/brain/mongoQuery.service';
import { CodeRagService } from '../src/brain/codeRag.service';
import { FamilyMemoryService } from '../src/brain/familyMemory.service';

describe('Brain API (e2e)', () => {
  let app: INestApplication<App>;

  const mockMemory = {
    store: jest.fn().mockResolvedValue(undefined),
    search: jest.fn().mockResolvedValue([]),
    recall: jest.fn().mockResolvedValue([]),
  };
  const mockAskBrain = { askBrain: jest.fn().mockResolvedValue('mock ask answer') };
  const mockMongoQuery = {
    askDatabase: jest.fn().mockResolvedValue({
      mongoQuery: { collection: 'test', query: {} },
      result: [],
      answer: 'mock mongo answer',
    }),
  };
  const mockCodeRag = { askCodeBrain: jest.fn().mockResolvedValue('mock code answer') };
  const mockFamilyMemory = {
    addFamilyFolder: jest.fn().mockResolvedValue({ added: 2, errors: [] }),
    addFamilyPhoto: jest.fn().mockResolvedValue({ status: 'stored', text: 'Family photo.' }),
    addFamilyDocument: jest.fn().mockResolvedValue({ status: 'stored', text: 'Summary.' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MemoryService)
      .useValue(mockMemory)
      .overrideProvider(AskBrainService)
      .useValue(mockAskBrain)
      .overrideProvider(MongoQueryService)
      .useValue(mockMongoQuery)
      .overrideProvider(CodeRagService)
      .useValue(mockCodeRag)
      .overrideProvider(FamilyMemoryService)
      .useValue(mockFamilyMemory)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /brain/store', () => {
    it('returns 201 and status stored', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/store')
        .send({ text: 'hello' })
        .expect(201);

      expect(res.body).toEqual({ status: 'stored' });
      expect(mockMemory.store).toHaveBeenCalledWith('hello', {});
    });

    it('passes metadata to store', async () => {
      await request(app.getHttpServer())
        .post('/brain/store')
        .send({ text: 'hi', metadata: { source: 'e2e' } })
        .expect(201);

      expect(mockMemory.store).toHaveBeenCalledWith('hi', { source: 'e2e' });
    });
  });

  describe('POST /brain/search', () => {
    it('returns search result array', async () => {
      mockMemory.search.mockResolvedValueOnce([{ id: '1', text: 'found' }]);
      const res = await request(app.getHttpServer())
        .post('/brain/search')
        .send({ query: 'test' })
        .expect(201);

      expect(res.body).toEqual([{ id: '1', text: 'found' }]);
      expect(mockMemory.search).toHaveBeenCalledWith('test');
    });
  });

  describe('POST /brain/query', () => {
    it('type ask: returns answer from AskBrainService', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/query')
        .send({ type: 'ask', question: 'What?' })
        .expect(201);

      expect(res.body).toEqual({ answer: 'mock ask answer' });
      expect(mockAskBrain.askBrain).toHaveBeenCalledWith('What?');
    });

    it('type mongo: returns answer, mongoQuery, result', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/query')
        .send({ type: 'mongo', question: 'Find deliveries' })
        .expect(201);

      expect(res.body.answer).toBe('mock mongo answer');
      expect(res.body.mongoQuery).toEqual({ collection: 'test', query: {} });
      expect(res.body.result).toEqual([]);
      expect(mockMongoQuery.askDatabase).toHaveBeenCalledWith('Find deliveries');
    });

    it('type code: returns answer from CodeRagService', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/query')
        .send({ type: 'code', question: 'Where is X?' })
        .expect(201);

      expect(res.body).toEqual({ answer: 'mock code answer' });
      expect(mockCodeRag.askCodeBrain).toHaveBeenCalledWith('Where is X?');
    });

    it('invalid type: returns 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/query')
        .send({ type: 'invalid', question: 'Q' })
        .expect(400);

      expect(res.body.message).toContain('Unknown type');
    });
  });

  describe('POST /brain/family/*', () => {
    it('addFolder returns added count and errors', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/family/addFolder')
        .send({ folderPath: '/tmp/sample', person: 'all' })
        .expect(201);
      expect(res.body).toEqual({ added: 2, errors: [] });
      expect(mockFamilyMemory.addFamilyFolder).toHaveBeenCalledWith('/tmp/sample', 'all');
    });

    it('addPhoto returns status and text', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/family/addPhoto')
        .send({ filePath: '/path/to/photo.jpg' })
        .expect(201);
      expect(res.body).toEqual({ status: 'stored', text: 'Family photo.' });
    });

    it('addDocument returns status and text', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/family/addDocument')
        .send({ filePath: '/path/to/doc.pdf', person: 'grandfather' })
        .expect(201);
      expect(res.body).toEqual({ status: 'stored', text: 'Summary.' });
      expect(mockFamilyMemory.addFamilyDocument).toHaveBeenCalledWith(
        '/path/to/doc.pdf',
        'grandfather',
      );
    });
  });

  describe('POST /brain/family/initialize', () => {
    it('returns textsLoaded, imagesAdded, documentsAdded, errors', async () => {
      const res = await request(app.getHttpServer())
        .post('/brain/family/initialize')
        .expect(201);
      expect(res.body).toHaveProperty('textsLoaded');
      expect(res.body).toHaveProperty('imagesAdded');
      expect(res.body).toHaveProperty('documentsAdded');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });
  });
});
