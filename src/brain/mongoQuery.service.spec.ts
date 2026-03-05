import { Test, TestingModule } from '@nestjs/testing';
import { MongoQueryService } from './mongoQuery.service';
import { LlmClient } from '../llm/llmClient';
import { MongoExplainService } from './mongoExplain.service';
import type { MongoQuerySpec } from './types/mongo.types';

describe('MongoQueryService', () => {
  let service: MongoQueryService;
  let llm: jest.Mocked<Pick<LlmClient, 'generate'>>;
  let mongoExplain: jest.Mocked<
    Pick<MongoExplainService, 'runMongoQuery' | 'explainMongoResult'>
  >;

  const sampleSpec: MongoQuerySpec = {
    collection: 'deliveries',
    query: { 'items.huId': 'HU123' },
  };

  beforeEach(async () => {
    llm = {
      generate: jest.fn().mockResolvedValue(JSON.stringify(sampleSpec)),
    };
    mongoExplain = {
      runMongoQuery: jest.fn().mockResolvedValue([{ _id: '1', items: [] }]),
      explainMongoResult: jest.fn().mockResolvedValue('Found 1 delivery.'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoQueryService,
        { provide: LlmClient, useValue: llm },
        { provide: MongoExplainService, useValue: mongoExplain },
      ],
    }).compile();

    service = module.get<MongoQueryService>(MongoQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generateMongoQuery returns parsed spec from LLM', async () => {
    const spec = await service.generateMongoQuery('Find delivery HU123');
    expect(llm.generate).toHaveBeenCalled();
    expect(spec).toEqual(sampleSpec);
  });

  it('askDatabase: generates query, runs it, explains result', async () => {
    const result = await service.askDatabase('Find delivery HU123');

    expect(mongoExplain.runMongoQuery).toHaveBeenCalledWith(sampleSpec);
    expect(mongoExplain.explainMongoResult).toHaveBeenCalledWith(
      'Find delivery HU123',
      [{ _id: '1', items: [] }],
    );
    expect(result.mongoQuery).toEqual(sampleSpec);
    expect(result.result).toEqual([{ _id: '1', items: [] }]);
    expect(result.answer).toBe('Found 1 delivery.');
  });
});
