import { Injectable } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { LlmClient } from '../llm/llmClient';
import { DEFAULT_LLM_MODEL } from '../common/constants';
import { buildContextQuestionPrompt } from '../common/promptHelpers';

@Injectable()
export class RagService {
  constructor(
    private readonly memory: MemoryService,
    private readonly llm: LlmClient,
  ) {}

  async retrieve(query: string, topK = 5): Promise<unknown[]> {
    void topK;
    return this.memory.search(query);
  }

  async query(question: string): Promise<string> {
    const context = await this.retrieve(question);
    const prompt = buildContextQuestionPrompt(context, question, {
      suffix:
        'Answer based on the context above. If the context is empty, answer from general knowledge.',
    });
    return this.llm.generate(DEFAULT_LLM_MODEL, prompt);
  }
}
