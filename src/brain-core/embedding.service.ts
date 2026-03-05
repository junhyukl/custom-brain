import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  DEFAULT_EMBEDDING_MODEL,
  OLLAMA_URL,
  zeroVector,
} from '../common/constants';

function ollamaEmbedHint(): string {
  return `Ollama 임베딩 실패. 다음을 확인하세요: 1) ollama serve 실행 2) ollama pull ${DEFAULT_EMBEDDING_MODEL} 3) Ollama 0.3.4 이상`;
}

function wrapOllamaError(err: unknown): Error {
  const status = axios.isAxiosError(err) ? err.response?.status : null;
  const msg = axios.isAxiosError(err) ? err.message : String(err);
  const hint = ollamaEmbedHint();
  if (status === 404) return new Error(`${hint} (404)`);
  return new Error(`${hint} (${msg})`);
}

@Injectable()
export class EmbeddingService {
  async embed(text: string): Promise<number[]> {
    if (!text?.trim()) return zeroVector();
    try {
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
    } catch (err: unknown) {
      console.warn('[EmbeddingService]', err instanceof Error ? err.message : err);
      throw wrapOllamaError(err);
    }
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
