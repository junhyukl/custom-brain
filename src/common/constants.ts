/** 기본 LLM 모델 (Ollama). RAG, askBrain, memory evaluator에서 사용 */
export const DEFAULT_LLM_MODEL = 'mistral:7b-instruct';

/** 임베딩 모델 (Ollama). 벡터 검색용 */
export const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text';

/** 벡터 차원 (nomic-embed-text) */
export const EMBEDDING_DIMENSION = 768;

/** Qdrant 메모리 컬렉션명 */
export const COLLECTION_MEMORY = 'memories';

/** Mongo 컬렉션명 */
export const MONGO_COLLECTION_MEMORIES = 'memories';
export const MONGO_COLLECTION_PERSONS = 'persons';

/** URL / DB (env override) */
export const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
export const QDRANT_URL = process.env.QDRANT_URL ?? 'http://localhost:6333';
export const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://localhost:27017';
export const MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? 'custom_brain';
export const VISION_MODEL = process.env.VISION_MODEL ?? 'llava';

/** Supported photo extensions for ingestion */
export const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const PHOTO_EXT_REGEX = /\.(jpg|jpeg|png|webp)$/i;

/** Document extensions for ingestion (PDF, DOCX, TXT, MD) */
export const DOCUMENT_EXT_REGEX = /\.(pdf|docx|txt|md)$/i;

/** Zero vector for missing embeddings (same dimension as model output). */
export function zeroVector(dimension = EMBEDDING_DIMENSION): number[] {
  return new Array(dimension).fill(0);
}

/** 업로드 최대 파일 크기 (25MB) */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** API 기본 limit 값 */
export const DEFAULT_RECALL_LIMIT = 50;
export const DEFAULT_TIMELINE_LIMIT = 100;
export const DEFAULT_SEARCH_LIMIT = 10;

/** Query string limit 파싱 (빈 값/NaN이면 fallback) */
export function parseLimit(value: string | undefined, fallback: number): number {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}
