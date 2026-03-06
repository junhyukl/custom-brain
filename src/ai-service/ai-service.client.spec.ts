import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { AiServiceClient, AI_SERVICE_URL_OVERRIDE } from './ai-service.client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const AI_SERVICE_URL = 'http://localhost:8000';

describe('AiServiceClient', () => {
  let client: AiServiceClient;

  beforeEach(async () => {
    const mod: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: AI_SERVICE_URL_OVERRIDE, useValue: AI_SERVICE_URL },
        AiServiceClient,
      ],
    }).compile();
    client = mod.get(AiServiceClient);
  });

  describe('isAvailable', () => {
    it('returns false when baseURL is empty', async () => {
      const mod = await Test.createTestingModule({
        providers: [AiServiceClient],
      }).compile();
      const c = mod.get(AiServiceClient);
      expect(c.isAvailable()).toBe(false);
    });

    it('returns true when baseURL is set', () => {
      expect(client.isAvailable()).toBe(true);
    });
  });

  describe('analyzePhoto', () => {
    it('calls POST /analyze-photo with path and returns data', async () => {
      const result = { caption: 'A photo', people: [], ocr: '', embedding: [0.1, 0.2] };
      mockedAxios.post.mockResolvedValueOnce({ data: result });

      const out = await client.analyzePhoto('/tmp/photo.jpg');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${AI_SERVICE_URL}/analyze-photo`,
        { path: '/tmp/photo.jpg' },
        { timeout: 120_000 },
      );
      expect(out).toEqual(result);
    });
  });

  describe('embed', () => {
    it('calls POST /embed and returns vector', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { vector: [1, 2, 3] } });

      const out = await client.embed('hello');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${AI_SERVICE_URL}/embed`,
        { text: 'hello' },
        { timeout: 30_000 },
      );
      expect(out).toEqual([1, 2, 3]);
    });

    it('returns empty array when response has no vector', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: {} });

      const out = await client.embed('hi');

      expect(out).toEqual([]);
    });
  });
});
