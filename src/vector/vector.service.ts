import { Injectable } from '@nestjs/common';
import { QdrantClient } from './qdrant.client';
import { COLLECTION_MEMORY } from '../common/constants';

export interface VectorSearchHit {
  id: string;
  score: number;
  payload?: Record<string, unknown>;
}

@Injectable()
export class VectorService {
  constructor(private readonly qdrant: QdrantClient) {}

  /** Search by precomputed vector (caller does embedding). */
  async search(
    vector: number[],
    limit = 5,
  ): Promise<VectorSearchHit[]> {
    await this.qdrant.ensureCollection(COLLECTION_MEMORY);
    return this.qdrant.search(COLLECTION_MEMORY, vector, limit);
  }

  async insert(params: {
    id: string;
    type: string;
    content: string;
    metadata?: Record<string, unknown>;
    vector: number[];
  }): Promise<void> {
    await this.qdrant.ensureCollection(COLLECTION_MEMORY);
    await this.qdrant.upsert(COLLECTION_MEMORY, [
      {
        id: params.id,
        vector: params.vector,
        payload: {
          type: params.type,
          content: params.content.slice(0, 500),
          ...params.metadata,
        },
      },
    ]);
  }

  /**
   * Save a memory point to Qdrant (id + vector + payload).
   * For full flow (Qdrant + Mongo Memory) use MemoryService.store() instead.
   */
  async saveVector(params: {
    id: string;
    type: string;
    content: string;
    metadata?: Record<string, unknown>;
    embedding: number[];
  }): Promise<void> {
    await this.insert({
      id: params.id,
      type: params.type,
      content: params.content,
      metadata: params.metadata,
      vector: params.embedding,
    });
  }
}
