import { Injectable } from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';
import { LlmClient } from '../llm/llmClient';
import { DEFAULT_LLM_MODEL } from '../common/constants';
import type { Memory } from '../schemas';

@Injectable()
export class RagService {
  constructor(
    private readonly memory: MemoryService,
    private readonly llm: LlmClient,
  ) {}

  async retrieve(query: string, topK = 5): Promise<Memory[]> {
    return this.memory.search(query, topK);
  }

  async query(question: string): Promise<string> {
    const context = await this.retrieve(question);
    const contextText = context.length
      ? context.map((m) => m.content).filter(Boolean).join('\n---\n')
      : '';
    const prompt = `Context:
${contextText || '(no relevant memories)'}

Question:
${question}

Answer based on the context above. If the context is empty, answer from general knowledge.`;
    return this.llm.generate(DEFAULT_LLM_MODEL, prompt);
  }
}
