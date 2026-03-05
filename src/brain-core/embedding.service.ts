import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  DEFAULT_EMBEDDING_MODEL,
  OLLAMA_URL,
  zeroVector,
} from '../common/constants';

@Injectable()
export class EmbeddingService {
  async embed(text: string): Promise<number[]> {
    if (!text?.trim()) return zeroVector();
    const { data } = await axios.post<{
      embeddings?: number[][];
      embedding?: number[];
    }>(`${OLLAMA_URL}/api/embed`, {
      model: DEFAULT_EMBEDDING_MODEL,
      input: text.trim(),
    });
    if (data.embeddings?.[0]) return data.embeddings[0];
    if (data.embedding) return data.embedding;
    return [];
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    const { data } = await axios.post<{ embeddings?: number[][] }>(
      `${OLLAMA_URL}/api/embed`,
      { model: DEFAULT_EMBEDDING_MODEL, input: texts },
    );
    const list = data.embeddings ?? [];
    return list.length ? list : Promise.all(texts.map((t) => this.embed(t)));
  }
}
