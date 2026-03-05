import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  async embed(text: string): Promise<number[]> {
    // TODO: call embedding model (e.g. Ollama nomic-embed-text)
    return [];
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
