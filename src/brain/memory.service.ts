import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class MemoryService {
  private readonly client = new QdrantClient({
    url: 'http://localhost:6333',
    checkCompatibility: false,
  });

  async recall(): Promise<unknown[]> {
    // 단순 예시 (임베딩 붙이면 확장 가능)
    return [];
  }

  /** Search memory by query (현재는 recall 반환, 추후 embedding + vector search) */
  async search(query: string): Promise<unknown[]> {
    void query;
    return this.recall();
  }

  async store(
    text: string,
    options?: { source?: string },
  ): Promise<void> {
    // 나중에 embedding 추가; payload에 source 저장 가능
    void text;
    void options;
  }
}
