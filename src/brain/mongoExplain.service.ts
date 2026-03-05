import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../db/database.service';
import { LlmClient } from '../llm/llmClient';
import { DEFAULT_LLM_MODEL, MONGO_QUERY_LIMIT } from '../common/constants';
import type { MongoQuerySpec } from './types/mongo.types';

const EXPLAIN_PROMPT = `User question:
{{question}}

Database result:
{{result}}

Explain clearly.`;

@Injectable()
export class MongoExplainService {
  constructor(
    private readonly db: DatabaseService,
    private readonly llm: LlmClient,
  ) {}

  async runMongoQuery(spec: MongoQuerySpec, limit = MONGO_QUERY_LIMIT): Promise<unknown[]> {
    return this.db.runQuery(spec.collection, spec.query, limit);
  }

  async explainMongoResult(question: string, result: unknown[]): Promise<string> {
    const prompt = EXPLAIN_PROMPT.replace('{{question}}', question).replace(
      '{{result}}',
      JSON.stringify(result),
    );
    return this.llm.generate(DEFAULT_LLM_MODEL, prompt);
  }
}
