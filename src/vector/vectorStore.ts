import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class VectorStore {
  private readonly client = new QdrantClient({
    url: 'http://localhost:6333',
    checkCompatibility: false,
  });

  async upsert(
    collection: string,
    points: Array<{ id: string; vector: number[]; payload?: Record<string, unknown> }>,
  ): Promise<void> {
    await this.client.upsert(collection, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload ?? {},
      })),
    });
  }

  async search(
    collection: string,
    vector: number[],
    limit = 10,
  ): Promise<Array<{ id: string; score: number; payload?: Record<string, unknown> }>> {
    const result = await this.client.search(collection, {
      vector,
      limit,
      with_payload: true,
    });
    return result.map((r) => ({
      id: String(r.id),
      score: r.score ?? 0,
      payload: r.payload as Record<string, unknown> | undefined,
    }));
  }

  /** 컬렉션이 없으면 생성 (이미 있으면 무시) */
  async ensureCollection(collection: string, vectorSize: number): Promise<void> {
    const exists = await this.client.collectionExists(collection);
    if (!exists) {
      await this.client.createCollection(collection, {
        vectors: { size: vectorSize, distance: 'Cosine' },
      });
    }
  }
}
