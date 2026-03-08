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

  it('linkPersonToPhoto runs MERGE Person, Memory, APPEARS_IN', async () => {
    await service.linkPersonToPhoto('father', 'mem-123');

    expect(neo4jRun).toHaveBeenCalledWith(
      expect.stringContaining('APPEARS_IN'),
      { personName: 'father', memoryId: 'mem-123' },
    );
    expect(neo4jRun.mock.calls[0][0]).toContain("m.type = 'photo'");
  });

  it('linkPersonToVoice runs MERGE Person, Memory, SPOKE', async () => {
    await service.linkPersonToVoice('mother', 'mem-456');

    expect(neo4jRun).toHaveBeenCalledWith(
      expect.stringContaining('SPOKE'),
      { personName: 'mother', memoryId: 'mem-456' },
    );
    expect(neo4jRun.mock.calls[0][0]).toContain("m.type = 'voice'");
  });

  it('linkPersonToPhoto and linkPersonToVoice do nothing when name or memoryId empty', async () => {
    const countBefore = neo4jRun.mock.calls.length;
    await service.linkPersonToPhoto('', 'mem-1');
    await service.linkPersonToPhoto('x', '');
    await service.linkPersonToVoice('', 'mem-2');
    expect(neo4jRun.mock.calls.length).toBe(countBefore);
  });

  it('addRelation runs MERGE (a)-[:FATHER]->(b)', async () => {
    await service.addRelation('John', 'FATHER', 'Mike');

    expect(neo4jRun).toHaveBeenCalledWith(
      expect.stringContaining('MERGE (a)-[:FATHER]->(b)'),
      { fromName: 'John', toName: 'Mike' },
    );
  });

  it('addRelation ignores invalid relation type', async () => {
    const countBefore = neo4jRun.mock.calls.length;
    await service.addRelation('John', 'INVALID_REL', 'Mike');
    await service.addRelation('John', '', 'Mike');
    expect(neo4jRun.mock.calls.length).toBe(countBefore);
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

  it('linkPersonToPhoto and linkPersonToVoice do nothing', async () => {
    const neo4jRun = jest.fn();
    const mod = await Test.createTestingModule({
      providers: [
        FamilyGraphService,
        { provide: Neo4jService, useValue: { isAvailable: () => false, run: neo4jRun } },
      ],
    }).compile();
    const service = mod.get(FamilyGraphService);

    await service.linkPersonToPhoto('father', 'mem-1');
    await service.linkPersonToVoice('mother', 'mem-2');

    expect(neo4jRun).not.toHaveBeenCalled();
  });
});
