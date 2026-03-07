import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  DEFAULT_EMBEDDING_MODEL,
  EMBED_MAX_INPUT_CHARS,
  OLLAMA_URL,
  zeroVector,
} from '../common/constants';

/** Ollama에 보낼 수 있는 절대 상한 (일부 환경에서 8192 토큰 미만일 수 있음) */
const EMBED_SAFETY_CAP = 2048;

/** context length 초과 방지: 앞부분만 잘라서 반환. 항상 SAFETY_CAP 이하로. */
function truncateForEmbed(text: string): string {
  const limit = Math.min(EMBED_MAX_INPUT_CHARS, EMBED_SAFETY_CAP);
  if (text.length <= limit) return text;
  return text.slice(0, limit);
}

function ollamaEmbedHint(detail?: string): string {
  const base = `Ollama 임베딩 실패. 확인: 1) ollama serve 2) ollama pull ${DEFAULT_EMBEDDING_MODEL} 3) Ollama 0.3.4 이상 권장`;
  return detail ? `${base} — ${detail}` : base;
}

function getOllamaErrorDetail(err: unknown): string | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const data = err.response?.data;
  if (data == null) return err.response?.status ? `${err.response.status}` : undefined;
  if (typeof data === 'string') return data;
  const msg = (data as { error?: string })?.error;
  return msg ?? JSON.stringify(data).slice(0, 200);
}

function wrapOllamaError(err: unknown): Error {
  const status = axios.isAxiosError(err) ? err.response?.status : null;
  const detail = getOllamaErrorDetail(err);
  const hint = ollamaEmbedHint(detail ?? (status ? `status ${status}` : undefined));
  return new Error(hint);
}

/** 구버전 Ollama: /api/embeddings + prompt (단일 텍스트만) */
async function embedLegacy(url: string, model: string, text: string): Promise<number[]> {
  const { data } = await axios.post<{ embedding?: number[] }>(`${url}/api/embeddings`, {
    model,
    prompt: text,
  });
  return data.embedding ?? [];
}

@Injectable()
export class EmbeddingService {
  async embed(text: string): Promise<number[]> {
    if (!text?.trim()) return zeroVector();
    const trimmed = text.trim();
    const input = truncateForEmbed(trimmed);
    try {
      const { data } = await axios.post<{
        embeddings?: number[][];
        embedding?: number[];
      }>(`${OLLAMA_URL}/api/embed`, {
        model: DEFAULT_EMBEDDING_MODEL,
        input,
        truncate: true,
      });
      if (data.embeddings?.[0]) return data.embeddings[0];
      if (data.embedding) return data.embedding;
      return [];
    } catch (err: unknown) {
      const is400 = axios.isAxiosError(err) && err.response?.status === 400;
      if (is400) {
        try {
          const vec = await embedLegacy(OLLAMA_URL, DEFAULT_EMBEDDING_MODEL, input);
          if (vec.length) return vec;
        } catch {
          // fallback 실패 시 아래에서 원래 에러로 던짐
        }
      }
      console.warn('[EmbeddingService]', err instanceof Error ? err.message : err);
      throw wrapOllamaError(err);
    }
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    const truncated = texts.map((t) => truncateForEmbed(t.trim()));
    try {
      const { data } = await axios.post<{ embeddings?: number[][] }>(
        `${OLLAMA_URL}/api/embed`,
        { model: DEFAULT_EMBEDDING_MODEL, input: truncated, truncate: true },
      );
      const list = data.embeddings ?? [];
      if (list.length) return list;
    } catch (err: unknown) {
      const is400 = axios.isAxiosError(err) && err.response?.status === 400;
      if (is400) {
        const results: number[][] = [];
        for (const t of texts) {
          const vec = await this.embed(t);
          results.push(vec);
        }
        return results;
      }
      throw wrapOllamaError(err);
    }
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
