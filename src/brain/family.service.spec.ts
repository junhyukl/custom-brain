import { Test, TestingModule } from '@nestjs/testing';
import { FamilyService } from './family.service';
import { MongoService } from '../mongo/mongo.service';

describe('FamilyService', () => {
  let service: FamilyService;
  let personCol: { insertOne: jest.Mock; find: jest.Mock; findOne: jest.Mock };
  let graphCol: { findOne: jest.Mock; insertOne: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    personCol = {
      insertOne: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
      findOne: jest.fn().mockResolvedValue(null),
    };
    graphCol = {
      findOne: jest.fn().mockResolvedValue(null),
      insertOne: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
    };

    const mockMongo = {
      getPersonCollection: () => personCol,
      getGraphEdgesCollection: () => graphCol,
    };

    const mod: TestingModule = await Test.createTestingModule({
      providers: [FamilyService, { provide: MongoService, useValue: mockMongo }],
    }).compile();

    service = mod.get(FamilyService);
  });

  describe('createPerson', () => {
    it('inserts person and returns doc with id', async () => {
      const person = await service.createPerson({ name: 'Alice', relation: 'child' });

      expect(personCol.insertOne).toHaveBeenCalled();
      expect(person.name).toBe('Alice');
      expect(person.relation).toBe('child');
      expect(person.id).toBeDefined();
    });
  });

  describe('findPersonByName', () => {
    it('returns person when found', async () => {
      const doc = { id: '1', name: 'Bob', relation: 'child', parentIds: [] };
      personCol.findOne.mockResolvedValueOnce(doc);

      const out = await service.findPersonByName('Bob');
      expect(out).toEqual(doc);
    });

    it('returns null when not found', async () => {
      const out = await service.findPersonByName('Nobody');
      expect(out).toBeNull();
    });
  });

  describe('updatePeople', () => {
    it('creates person when name does not exist', async () => {
      personCol.findOne.mockResolvedValue(null);

      await service.updatePeople(['Charlie']);

      expect(personCol.insertOne).toHaveBeenCalled();
    });

    it('skips when person already exists', async () => {
      personCol.findOne.mockResolvedValue({ id: '1', name: 'Dave', relation: 'child', parentIds: [] });

      await service.updatePeople(['Dave']);

      expect(personCol.insertOne).not.toHaveBeenCalled();
    });
  });
});
