import { Injectable } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { LlmClient } from '../llm/llmClient';
import { MemoryEvaluatorService } from './memoryEvaluator.service';
import { DEFAULT_LLM_MODEL } from '../common/constants';
import { buildContextQuestionPrompt } from '../common/promptHelpers';

/**
 * askBrain(question):
 * 1. context = searchMemory(question)
 * 2. answer = askLLM(context + question)
 * 3. autoMemory(question), autoMemory(answer)
 * 4. return answer
 */
@Injectable()
export class AskBrainService {
  constructor(
    private readonly memory: MemoryService,
    private readonly llm: LlmClient,
    private readonly memoryEvaluator: MemoryEvaluatorService,
  ) {}

  async askBrain(question: string): Promise<string> {
    const context = await this.memory.search(question);
    const prompt = buildContextQuestionPrompt(context, question);
    const answer = await this.llm.generate(DEFAULT_LLM_MODEL, prompt);
    await this.memoryEvaluator.evaluateAndMaybeStore(question);
    await this.memoryEvaluator.evaluateAndMaybeStore(answer);
    return answer;
  }
}
