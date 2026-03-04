import { Injectable } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class MemoryService {
  private readonly client = new QdrantClient({ url: 'http://localhost:6333' });

  async recall(): Promise<unknown[]> {
    // 단순 예시 (임베딩 붙이면 확장 가능)
    return [];
  }

  async store(_text: string): Promise<void> {
    // 나중에 embedding 추가
  }
}
