/** 기본 LLM 모델 (Ollama). RAG, askBrain, memory evaluator, mongo에서 사용 */
export const DEFAULT_LLM_MODEL = 'mistral:7b-instruct';

/** MongoDB runQuery 기본 limit */
export const MONGO_QUERY_LIMIT = 10;

/** 코드 RAG용 벡터 컬렉션 이름 */
export const CODE_COLLECTION = 'code';

/** 메모리(RAG/가족 히스토리 등) 벡터 컬렉션 */
export const MEMORY_COLLECTION = 'memory';

/** 메모리 임베딩 벡터 차원 (nomic-embed-text 기준) */
export const MEMORY_VECTOR_SIZE = 768;

/** Ollama 임베딩 모델 (code memory 등) */
export const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text';

/** Ollama API 기준 URL (embed 등) */
export const OLLAMA_BASE_URL = 'http://localhost:11434';

/** 코드 로더: 기본 읽을 확장자 */
export const CODE_LOADER_EXTENSIONS = ['.ts', '.js', '.tsx', '.jsx', '.json', '.md'];

/** 코드 로더: 제외할 디렉터리 */
export const CODE_SKIP_DIRS = ['node_modules', 'dist', '.git', 'coverage', '.next'];

/** 코드 검색 기본 limit */
export const CODE_SEARCH_LIMIT = 10;

/** Code RAG에 넣을 컨텍스트 청크 개수 */
export const CODE_RAG_CONTEXT_LIMIT = 8;

/** Brain 통합 쿼리 타입 (POST /brain/query) */
export const BRAIN_QUERY_TYPES = ['ask', 'mongo', 'code'] as const;
export type BrainQueryType = (typeof BRAIN_QUERY_TYPES)[number];
