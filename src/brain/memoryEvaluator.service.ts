import { Injectable } from '@nestjs/common';
import { LlmClient } from '../llm/llmClient';
import { MemoryService } from './memory.service';

const EVALUATOR_MODEL = 'mistral:7b-instruct';

@Injectable()
export class MemoryEvaluatorService {
  constructor(
    private readonly llm: LlmClient,
    private readonly memory: MemoryService,
  ) {}

  /**
   * autoMemory: LLM으로 저장 여부 판단 → YES면 store (source 옵션 지원)
   * - 빈 문자열 또는 30자 미만이면 LLM 호출 없이 무시
   */
  async evaluateAndMaybeStore(
    content: string,
    options?: { source?: string },
  ): Promise<{ important: boolean; stored: boolean }> {
    if (!content) return { important: false, stored: false };
    if (content.length < 30) return { important: false, stored: false };

    const important = await this.isImportant(content);
    if (important) {
      await this.memory.store(content, options ?? { source: 'auto' });
      return { important: true, stored: true };
    }
    return { important: false, stored: false };
  }

  /** Should this be saved as knowledge? Answer YES or NO. */
  async isImportant(content: string): Promise<boolean> {
    const prompt = `Should this be saved as knowledge?

${content}

Answer YES or NO.`;

    const result = await this.llm.generate(EVALUATOR_MODEL, prompt);
    return result.trim().toUpperCase().includes('YES');
  }
}
