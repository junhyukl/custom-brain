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

/** Zero vector for missing embeddings (same dimension as model output). */
export function zeroVector(dimension = EMBEDDING_DIMENSION): number[] {
  return new Array(dimension).fill(0);
}
