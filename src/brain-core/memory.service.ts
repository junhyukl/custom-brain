import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import { MongoService } from '../mongo/mongo.service';
import { VectorStore } from '../vector/vectorStore';
import { EmbeddingService } from './embedding.service';
import { S3Service } from '../storage/s3.service';
import { S3_REF_PREFIX } from '../config/storage.config';
import {
  COLLECTION_MEMORY,
  EMBEDDING_DIMENSION,
  zeroVector,
} from '../common/constants';
import type { Memory, MemoryScope, MemoryType, MemoryMetadata } from '../schemas';

@Injectable()
export class MemoryService {
  constructor(
    private readonly mongo: MongoService,
    private readonly vector: VectorStore,
    private readonly embedding: EmbeddingService,
    private readonly s3: S3Service,
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
      if (filePath.startsWith(S3_REF_PREFIX)) {
        const key = filePath.slice(S3_REF_PREFIX.length);
        await this.s3.deleteObject(key);
      } else {
        try {
          await fs.unlink(filePath);
        } catch {
          // ignore if file already missing
        }
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

  /**
   * v2: 외부에서 이미 계산한 벡터로 메모리 저장 (예: AI Service에서 caption + embedding 반환 시).
   * vector 길이가 0이면 zeroVector 사용.
   */
  async storeWithVector(
    content: string,
    vector: number[],
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
    const doc: Memory = {
      id,
      scope,
      type,
      content,
      metadata,
      createdAt,
    };
    await this.mongo.getMemoryCollection().insertOne(doc);
    const vec = vector?.length ? vector : zeroVector();
    await this.vector.upsert(COLLECTION_MEMORY, [
      { id, vector: vec, payload: { type, scope, content: content.slice(0, 500) } },
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

  /** 사진만 검색. type === 'photo' 인 메모리만 반환 (문서·메모 제외). */
  async searchPhotos(query: string, limit = 10): Promise<Memory[]> {
    const candidates = await this.search(query, limit * 3);
    return candidates.filter((m) => m.type === 'photo').slice(0, limit);
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

  /** v3: 메모리 메타데이터 일부 업데이트 (clusterId, clusterTopic 등). */
  async updateMetadata(
    id: string,
    patch: Partial<MemoryMetadata>,
  ): Promise<boolean> {
    const setObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) setObj[`metadata.${k}`] = v;
    }
    if (!Object.keys(setObj).length) return false;
    const result = await this.mongo.getMemoryCollection().updateOne(
      { id },
      { $set: setObj },
    );
    return result.modifiedCount === 1;
  }

  /**
   * 메모리 내용·메타데이터 수정. content 변경 시 재임베딩 후 Qdrant 업서트.
   */
  async update(
    id: string,
    payload: { content?: string; metadata?: Partial<MemoryMetadata> },
  ): Promise<Memory | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updates: Record<string, unknown> = {};
    if (payload.content !== undefined) updates.content = payload.content;
    if (payload.metadata !== undefined) {
      const merged = { ...existing.metadata, ...payload.metadata };
      for (const [k, v] of Object.entries(merged)) {
        updates[`metadata.${k}`] = v;
      }
    }
    if (!Object.keys(updates).length) return existing as Memory;

    await this.mongo.getMemoryCollection().updateOne({ id }, { $set: updates });

    if (payload.content !== undefined) {
      await this.ensureCollection();
      const embedding = await this.embedding.embed(payload.content);
      const type = existing.type;
      const scope = existing.scope;
      await this.vector.upsert(COLLECTION_MEMORY, [
        {
          id,
          vector: embedding.length ? embedding : zeroVector(),
          payload: { type, scope, content: payload.content.slice(0, 500) },
        },
      ]);
    }

    return this.getById(id);
  }
}
