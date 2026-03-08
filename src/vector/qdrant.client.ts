import { Injectable } from '@nestjs/common';
import { QdrantClient as QdrantClientSdk } from '@qdrant/js-client-rest';
import axios from 'axios';
import { EMBEDDING_DIMENSION, QDRANT_URL } from '../common/constants';
import { VectorStore } from './vectorStore';

@Injectable()
export class QdrantClient extends VectorStore {
  private readonly client = new QdrantClientSdk({
    url: QDRANT_URL,
    checkCompatibility: false,
  });

  async ensureCollection(collection: string, dimension = EMBEDDING_DIMENSION): Promise<void> {
    try {
      await axios.get(`${QDRANT_URL}/collections/${collection}`);
    } catch {
      await axios.put(`${QDRANT_URL}/collections/${collection}`, {
        vectors: { size: dimension, distance: 'Cosine' },
      });
    }
  }

  async deleteCollection(collection: string): Promise<void> {
    try {
      await axios.delete(`${QDRANT_URL}/collections/${collection}`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) return;
      throw err;
    }
  }

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

  async delete(collection: string, ids: string[]): Promise<void> {
    if (!ids.length) return;
    await this.client.delete(collection, { wait: true, points: ids });
  }

  async search(
    collection: string,
    vector: number[],
    limit = 10,
    options?: { payloadType?: string; scoreThreshold?: number },
  ): Promise<Array<{ id: string; score: number; payload?: Record<string, unknown> }>> {
    const filter =
      options?.payloadType != null
        ? { must: [{ key: 'type', match: { value: options.payloadType } }] }
        : undefined;
    const result = await this.client.search(collection, {
      vector,
      limit,
      with_payload: true,
      ...(filter && { filter }),
      ...(options?.scoreThreshold != null && { score_threshold: options.scoreThreshold }),
    });
    return result.map((r) => ({
      id: String(r.id),
      score: r.score ?? 0,
      payload: r.payload as Record<string, unknown> | undefined,
    }));
  }
}
