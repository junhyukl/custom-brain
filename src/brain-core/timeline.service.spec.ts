import { Test, TestingModule } from '@nestjs/testing';
import { TimelineService } from './timeline.service';
import { MongoService } from '../mongo/mongo.service';

describe('TimelineService', () => {
  let service: TimelineService;
  let mockCollection: { find: jest.Mock; sort: jest.Mock; limit: jest.Mock; toArray: jest.Mock; insertOne: jest.Mock };

  beforeEach(async () => {
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      insertOne: jest.fn().mockResolvedValue(undefined),
    };

    const mockMongo = {
      getMemoryCollection: () => mockCollection,
    };

    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        { provide: MongoService, useValue: mockMongo },
      ],
    }).compile();

    service = mod.get(TimelineService);
  });

  describe('getTimeline', () => {
    it('returns timeline entries from memory collection', async () => {
      const docs = [
        { id: '1', content: 'Event', type: 'photo', scope: 'personal', metadata: { date: '2024-01-01' }, createdAt: new Date() },
      ];
      mockCollection.toArray.mockResolvedValueOnce(docs);

      const result = await service.getTimeline(undefined, 10);
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockCollection.sort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(mockCollection.limit).toHaveBeenCalledWith(10);
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Event');
      expect(result[0].memoryId).toBe('1');
    });
  });

  describe('addEvent', () => {
    it('inserts event doc into memory collection', async () => {
      await service.addEvent('Trip to Seoul', 'personal');
      expect(mockCollection.insertOne).toHaveBeenCalled();
      const call = mockCollection.insertOne.mock.calls[0][0];
      expect(call.content).toBe('Trip to Seoul');
      expect(call.type).toBe('event');
      expect(call.scope).toBe('personal');
      expect(call.id).toMatch(/^timeline_/);
    });
  });

  describe('buildTimeline', () => {
    it('returns total and byYear counts', async () => {
      const docs = [
        { id: '1', metadata: { date: '2024-06-01' }, createdAt: new Date() },
        { id: '2', metadata: { date: '2024-08-01' }, createdAt: new Date() },
      ];
      mockCollection.toArray.mockResolvedValueOnce(docs);

      const result = await service.buildTimeline();
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(result.total).toBe(2);
      expect(result.withDate).toBe(2);
      expect(result.byYear['2024']).toBe(2);
    });
  });
});
