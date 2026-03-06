import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from './neo4j.service';

const originalEnv = process.env;

describe('Neo4jService', () => {
  let service: Neo4jService;

  beforeEach(async () => {
    process.env.NEO4J_URI = '';
    const mod: TestingModule = await Test.createTestingModule({
      providers: [Neo4jService],
    }).compile();
    service = mod.get(Neo4jService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('isAvailable returns false when NEO4J_URI is not set', () => {
    expect(service.isAvailable()).toBe(false);
  });

  it('getSession returns null when driver is null', () => {
    expect(service.getSession()).toBeNull();
  });

  it('run returns empty array when driver is null', async () => {
    const result = await service.run('RETURN 1', {});
    expect(result).toEqual([]);
  });
});
