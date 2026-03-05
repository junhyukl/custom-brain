import { Injectable } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { LlmClient } from '../llm/llmClient';

const RAG_MODEL = 'mistral:7b-instruct';

@Injectable()
export class RagService {
  constructor(
    private readonly memory: MemoryService,
    private readonly llm: LlmClient,
  ) {}

  async retrieve(query: string, topK = 5): Promise<unknown[]> {
    return this.memory.search(query);
  }

  async query(question: string): Promise<string> {
    const context = await this.retrieve(question);
    const prompt = `Context:
${JSON.stringify(context)}

Question:
${question}

Answer based on the context above. If the context is empty, answer from general knowledge.`;
    return this.llm.generate(RAG_MODEL, prompt);
  }
}
