import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { DEFAULT_EMBEDDING_MODEL, OLLAMA_BASE_URL } from '../common/constants';

const OLLAMA_EMBED_PATH = '/api/embed';

@Injectable()
export class EmbeddingService {
  async embed(text: string, model = DEFAULT_EMBEDDING_MODEL): Promise<number[]> {
    if (!text.trim()) return [];
    try {
      const { data } = await axios.post<{ embeddings?: number[][]; embedding?: number[] }>(
        `${OLLAMA_BASE_URL}${OLLAMA_EMBED_PATH}`,
        { model, input: text },
      );
      const emb = data.embeddings?.[0] ?? data.embedding;
      return Array.isArray(emb) ? emb : [];
    } catch {
      return [];
    }
  }

  async embedMany(texts: string[], model = DEFAULT_EMBEDDING_MODEL): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t, model)));
  }
}
