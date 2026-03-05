import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EmbeddingService } from './embedding.service';
import { VectorStore } from '../vector/vectorStore';
import { MEMORY_COLLECTION, MEMORY_VECTOR_SIZE } from '../common/constants';

export type MemoryPayload = {
  text: string;
  type?: string;
  person?: string;
  source?: string;
  file?: string;
  timestamp?: number;
  [key: string]: unknown;
};

@Injectable()
export class MemoryService implements OnModuleInit {
  private readonly logger = new Logger(MemoryService.name);
  private qdrantReady = false;

  constructor(
    private readonly embedding: EmbeddingService,
    private readonly vectorStore: VectorStore,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.vectorStore.ensureCollection(MEMORY_COLLECTION, MEMORY_VECTOR_SIZE);
      this.qdrantReady = true;
    } catch (err) {
      this.logger.warn(
        'Qdrant not available (localhost:6333). Memory store/search will be disabled until Qdrant is running.',
      );
    }
  }

  private async ensureReady(): Promise<boolean> {
    if (this.qdrantReady) return true;
    try {
      await this.vectorStore.ensureCollection(MEMORY_COLLECTION, MEMORY_VECTOR_SIZE);
      this.qdrantReady = true;
      return true;
    } catch {
      return false;
    }
  }

  async recall(): Promise<MemoryPayload[]> {
    return [];
  }

  /**
   * Search memory by query (embedding + vector search).
   * Returns array of { text, ...metadata } sorted by relevance.
   * Qdrant 미연결 시 빈 배열 반환.
   */
  async search(query: string, limit = 10): Promise<MemoryPayload[]> {
    if (!(await this.ensureReady())) return [];
    const vector = await this.embedding.embed(query);
    if (vector.length === 0) return [];
    try {
      const results = await this.vectorStore.search(MEMORY_COLLECTION, vector, limit);
      return results.map((r) => (r.payload ?? {}) as MemoryPayload);
    } catch {
      return [];
    }
  }

  /**
   * Store text with optional metadata. Embeds text and upserts to vector store.
   * Qdrant 미연결 시 무시.
   */
  async store(
    text: string,
    options?: { source?: string } & Record<string, unknown>,
  ): Promise<void> {
    if (!(await this.ensureReady())) return;
    const vector = await this.embedding.embed(text);
    if (vector.length === 0) return;
    const timestamp =
      typeof options?.timestamp === 'number'
        ? options.timestamp
        : Math.floor(Date.now() / 1000);
    const payload: MemoryPayload = { text, ...options, timestamp };
    try {
      await this.vectorStore.upsert(MEMORY_COLLECTION, [
        { id: randomUUID(), vector, payload },
      ]);
    } catch (err) {
      this.logger.warn('Memory store failed (Qdrant may be down).', err);
    }
  }
}
