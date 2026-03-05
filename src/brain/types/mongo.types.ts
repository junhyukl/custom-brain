/** LLM이 생성한 MongoDB 쿼리 스펙 */
export interface MongoQuerySpec {
  collection: string;
  query: Record<string, unknown>;
}

/** askDatabase 반환 형태 */
export interface AskDatabaseResult {
  mongoQuery: MongoQuerySpec;
  result: unknown[];
  answer: string;
}
