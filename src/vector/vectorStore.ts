export interface VectorSearchOptions {
  /** payload.type 값으로 필터 (예: 'photo', 'document') */
  payloadType?: string;
  /** 최소 유사도. 이하면 결과에서 제외 (코사인 0~1). */
  scoreThreshold?: number;
}

/** Backward-compat token; implementation is QdrantClient. */
export abstract class VectorStore {
  abstract ensureCollection(collection: string, dimension?: number): Promise<void>;
  abstract deleteCollection(collection: string): Promise<void>;
  abstract upsert(
    collection: string,
    points: Array<{ id: string; vector: number[]; payload?: Record<string, unknown> }>,
  ): Promise<void>;
  abstract delete(collection: string, ids: string[]): Promise<void>;
  abstract search(
    collection: string,
    vector: number[],
    limit?: number,
    options?: VectorSearchOptions,
  ): Promise<Array<{ id: string; score: number; payload?: Record<string, unknown> }>>;
}
