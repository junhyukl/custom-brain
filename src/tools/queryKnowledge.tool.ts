import { Injectable } from '@nestjs/common';
import { RagService } from '../brain/rag.service';

export interface QueryKnowledgeToolInput {
  question: string;
}

@Injectable()
export class QueryKnowledgeTool {
  name = 'query_knowledge';
  description = 'Query the knowledge base (RAG: vector search + LLM answer)';

  constructor(private readonly rag: RagService) {}

  async execute(input: QueryKnowledgeToolInput): Promise<string> {
    return this.rag.query(input.question);
  }
}
