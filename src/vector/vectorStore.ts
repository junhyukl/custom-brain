/** Backward-compat token; implementation is QdrantClient. */
export abstract class VectorStore {
  abstract ensureCollection(collection: string, dimension?: number): Promise<void>;
  abstract upsert(
    collection: string,
    points: Array<{ id: string; vector: number[]; payload?: Record<string, unknown> }>,
  ): Promise<void>;
  abstract search(
    collection: string,
    vector: number[],
    limit?: number,
  ): Promise<Array<{ id: string; score: number; payload?: Record<string, unknown> }>>;
}
