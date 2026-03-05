import { Injectable } from '@nestjs/common';

export interface QueryKnowledgeToolInput {
  question: string;
}

@Injectable()
export class QueryKnowledgeTool {
  name = 'query_knowledge';
  description = 'Query the knowledge base (RAG)';

  async execute(input: QueryKnowledgeToolInput): Promise<string> {
    // TODO: inject RagService and run query
    return '';
  }
}
