import { Test, TestingModule } from '@nestjs/testing';
import { FamilyGraphService } from './family-graph.service';
import { Neo4jService } from './neo4j.service';

describe('FamilyGraphService', () => {
  let service: FamilyGraphService;
  let neo4jRun: jest.Mock;

  beforeEach(async () => {
    neo4jRun = jest.fn().mockResolvedValue([]);

    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyGraphService,
        {
          provide: Neo4jService,
          useValue: { isAvailable: () => true, run: neo4jRun },
        },
      ],
    }).compile();

    service = mod.get(FamilyGraphService);
  });

  it('updatePeople calls MERGE for each name', async () => {
    await service.updatePeople(['Alice', 'Bob']);

    expect(neo4jRun).toHaveBeenCalledTimes(2);
    expect(neo4jRun).toHaveBeenNthCalledWith(1, 'MERGE (p:Person {name: $name}) RETURN p', { name: 'Alice' });
    expect(neo4jRun).toHaveBeenNthCalledWith(2, 'MERGE (p:Person {name: $name}) RETURN p', { name: 'Bob' });
  });

  it('updatePeople skips empty names', async () => {
    await service.updatePeople(['Alice', '', '  ', 'Bob']);

    expect(neo4jRun).toHaveBeenCalledTimes(2);
  });
});

describe('FamilyGraphService when Neo4j unavailable', () => {
  it('updatePeople does nothing', async () => {
    const neo4jRun = jest.fn();
    const mod = await Test.createTestingModule({
      providers: [
        FamilyGraphService,
        { provide: Neo4jService, useValue: { isAvailable: () => false, run: neo4jRun } },
      ],
    }).compile();
    const service = mod.get(FamilyGraphService);

    await service.updatePeople(['Alice']);

    expect(neo4jRun).not.toHaveBeenCalled();
  });
});
