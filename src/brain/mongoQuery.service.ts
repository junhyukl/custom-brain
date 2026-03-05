import { Injectable } from '@nestjs/common';
import { LlmClient } from '../llm/llmClient';
import { MongoExplainService } from './mongoExplain.service';
import { DEFAULT_LLM_MODEL } from '../common/constants';
import { parseJsonFromLlm } from '../common/llmJson';
import type { MongoQuerySpec, AskDatabaseResult } from './types/mongo.types';

const MONGO_QUERY_PROMPT = `You are a MongoDB expert.

Convert the question into a MongoDB query.

Rules:
- Return ONLY JSON
- Do not explain
- Use collection name if possible

Question:
{{question}}

Example format:

{
 "collection": "deliveries",
 "query": { "items.huId": "HU123" }
}
`;

@Injectable()
export class MongoQueryService {
  constructor(
    private readonly llm: LlmClient,
    private readonly mongoExplain: MongoExplainService,
  ) {}

  async generateMongoQuery(question: string): Promise<MongoQuerySpec> {
    const prompt = MONGO_QUERY_PROMPT.replace('{{question}}', question);
    const result = await this.llm.generate(DEFAULT_LLM_MODEL, prompt);
    return parseJsonFromLlm<MongoQuerySpec>(result);
  }

  async askDatabase(question: string): Promise<AskDatabaseResult> {
    const mongoQuery = await this.generateMongoQuery(question);
    const result = await this.mongoExplain.runMongoQuery(mongoQuery);
    const answer = await this.mongoExplain.explainMongoResult(question, result);

    return {
      mongoQuery,
      result,
      answer,
    };
  }
}
