import { Injectable, OnModuleInit } from '@nestjs/common';
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
  constructor(
    private readonly embedding: EmbeddingService,
    private readonly vectorStore: VectorStore,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.vectorStore.ensureCollection(MEMORY_COLLECTION, MEMORY_VECTOR_SIZE);
  }

  async recall(): Promise<MemoryPayload[]> {
    return [];
  }

  /**
   * Search memory by query (embedding + vector search).
   * Returns array of { text, ...metadata } sorted by relevance.
   */
  async search(query: string, limit = 10): Promise<MemoryPayload[]> {
    const vector = await this.embedding.embed(query);
    if (vector.length === 0) return [];
    const results = await this.vectorStore.search(MEMORY_COLLECTION, vector, limit);
    return results.map((r) => (r.payload ?? {}) as MemoryPayload);
  }

  /**
   * Store text with optional metadata. Embeds text and upserts to vector store.
   * metadata.type: family_history | family_memory | event 등
   * metadata.person, metadata.source, metadata.file 등 가족 메모리 스키마 지원.
   */
  async store(
    text: string,
    options?: { source?: string } & Record<string, unknown>,
  ): Promise<void> {
    const vector = await this.embedding.embed(text);
    if (vector.length === 0) return;
    const timestamp =
      typeof options?.timestamp === 'number'
        ? options.timestamp
        : Math.floor(Date.now() / 1000);
    const payload: MemoryPayload = { text, ...options, timestamp };
    await this.vectorStore.upsert(MEMORY_COLLECTION, [
      { id: randomUUID(), vector, payload },
    ]);
  }
}
