import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EmbeddingService } from './embedding.service';
import { VectorStore } from '../vector/vectorStore';
import { CODE_COLLECTION, CODE_SEARCH_LIMIT } from '../common/constants';
import type { ParsedChunk, CodeSearchResult } from './types/code.types';

@Injectable()
export class CodeMemoryService {
  constructor(
    private readonly embedding: EmbeddingService,
    private readonly vectorStore: VectorStore,
  ) {}

  /** 단일 코드 청크를 임베딩해 벡터 스토어에 저장 */
  async storeCodeMemory(chunk: ParsedChunk): Promise<void> {
    const vector = await this.embedding.embed(chunk.text);
    if (vector.length === 0) return;
    const id = randomUUID();
    await this.vectorStore.upsert(CODE_COLLECTION, [
      {
        id,
        vector,
        payload: { filePath: chunk.filePath, text: chunk.text, type: 'code' },
      },
    ]);
  }

  /** 여러 청크 일괄 저장 */
  async storeCodeMemories(chunks: ParsedChunk[]): Promise<void> {
    const points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }> = [];
    for (const chunk of chunks) {
      const vector = await this.embedding.embed(chunk.text);
      if (vector.length === 0) continue;
      points.push({
        id: randomUUID(),
        vector,
        payload: { filePath: chunk.filePath, text: chunk.text, type: 'code' },
      });
    }
    if (points.length > 0) {
      await this.vectorStore.upsert(CODE_COLLECTION, points);
    }
  }

  /** 질의와 유사한 코드 청크를 벡터 검색 */
  async searchCodeMemory(query: string, limit = CODE_SEARCH_LIMIT): Promise<CodeSearchResult[]> {
    const vector = await this.embedding.embed(query);
    if (vector.length === 0) return [];
    const results = await this.vectorStore.search(CODE_COLLECTION, vector, limit);
    return results.map((r) => ({
      filePath: (r.payload?.filePath as string) ?? '',
      text: (r.payload?.text as string) ?? '',
      score: r.score,
    }));
  }
}
