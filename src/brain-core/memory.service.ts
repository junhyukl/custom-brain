import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import { MongoService } from '../mongo/mongo.service';
import { VectorStore } from '../vector/vectorStore';
import { EmbeddingService } from './embedding.service';
import {
  COLLECTION_MEMORY,
  EMBEDDING_DIMENSION,
  zeroVector,
} from '../common/constants';
import type { Memory, MemoryScope, MemoryType, MemoryMetadata } from '../brain-schema';

@Injectable()
export class MemoryService {
  constructor(
    private readonly mongo: MongoService,
    private readonly vector: VectorStore,
    private readonly embedding: EmbeddingService,
  ) {}

  private async ensureCollection(): Promise<void> {
    await this.vector.ensureCollection(COLLECTION_MEMORY, EMBEDDING_DIMENSION);
  }

  async getById(id: string): Promise<Memory | null> {
    const doc = await this.mongo.getMemoryCollection().findOne({ id });
    return doc as Memory | null;
  }

  async delete(id: string): Promise<{ deleted: boolean; error?: string }> {
    const mem = await this.getById(id);
    if (!mem) return { deleted: false, error: '메모리를 찾을 수 없습니다.' };

    const filePath = mem.metadata?.filePath;
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch {
        // ignore if file already missing
      }
    }
    await this.vector.delete(COLLECTION_MEMORY, [id]);
    const result = await this.mongo.getMemoryCollection().deleteOne({ id });
    return { deleted: result.deletedCount === 1 };
  }

  /** 메모리·타임라인 전부 비우기 (Mongo + Qdrant). 다음 업로드 시 컬렉션 자동 재생성. */
  async clearAll(): Promise<{ mongoDeleted: number }> {
    const col = this.mongo.getMemoryCollection();
    const r = await col.deleteMany({});
    try {
      await this.vector.deleteCollection(COLLECTION_MEMORY);
    } catch {
      // Qdrant 컬렉션 없으면 무시
    }
    return { mongoDeleted: r.deletedCount };
  }

  async store(
    content: string,
    options: {
      scope?: MemoryScope;
      type?: MemoryType;
      metadata?: MemoryMetadata;
      source?: string;
    } = {},
  ): Promise<Memory> {
    await this.ensureCollection();
    const scope = options.scope ?? 'personal';
    const type = options.type ?? 'note';
    const metadata: MemoryMetadata = {
      ...options.metadata,
      ...(options.source ? { source: options.source } : {}),
    };
    const id = randomUUID();
    const createdAt = new Date();
    const embedding = await this.embedding.embed(content);
    const doc: Memory = {
      id,
      scope,
      type,
      content,
      metadata,
      createdAt,
    };
    await this.mongo.getMemoryCollection().insertOne(doc);
    await this.vector.upsert(COLLECTION_MEMORY, [
      {
        id,
        vector: embedding.length ? embedding : zeroVector(),
        payload: { type, scope, content: content.slice(0, 500) },
      },
    ]);
    return doc;
  }

  async search(query: string, limit = 10, scope?: MemoryScope): Promise<Memory[]> {
    await this.ensureCollection();
    const vector = await this.embedding.embed(query);
    const hits = await this.vector.search(
      COLLECTION_MEMORY,
      vector.length ? vector : zeroVector(),
      limit,
    );
    if (!hits.length) return [];
    const ids = hits.map((h) => h.id);
    const docs = await this.mongo.getMemoryCollection().find({ id: { $in: ids } }).toArray();
    const byId = new Map(docs.map((d) => [d.id, d]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as Memory[];
  }

  async searchPhotos(query: string, limit = 10): Promise<Memory[]> {
    const candidates = await this.search(query, limit * 2, 'family');
    return candidates.filter((m) => m.type === 'photo' || m.type === 'document').slice(0, limit);
  }

  async searchDocuments(query: string, limit = 10): Promise<Memory[]> {
    const candidates = await this.search(query, limit * 2);
    return candidates.filter((m) => m.type === 'document').slice(0, limit);
  }

  async recall(limit = 50): Promise<Memory[]> {
    return this.mongo
      .getMemoryCollection()
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
}
