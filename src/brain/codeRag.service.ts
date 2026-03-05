import { Injectable } from '@nestjs/common';
import { CodeMemoryService } from './codeMemory.service';
import { LlmClient } from '../llm/llmClient';
import { DEFAULT_LLM_MODEL, CODE_RAG_CONTEXT_LIMIT } from '../common/constants';

const CODE_RAG_PROMPT = `You are an expert in the user's project codebase.

Use the context below to answer the question.

Context (relevant code chunks):
{{context}}

Question:
{{question}}

Answer clearly and reference file paths when relevant.`;

@Injectable()
export class CodeRagService {
  constructor(
    private readonly codeMemory: CodeMemoryService,
    private readonly llm: LlmClient,
  ) {}

  /** Code Brain: 검색된 코드 컨텍스트 + LLM으로 질문에 답변 */
  async askCodeBrain(question: string, contextLimit = CODE_RAG_CONTEXT_LIMIT): Promise<string> {
    const context = await this.codeMemory.searchCodeMemory(question, contextLimit);
    const contextStr =
      context.length > 0
        ? context.map((c) => `[${c.filePath}]\n${c.text}`).join('\n\n---\n\n')
        : '(No indexed code found. Index the project first via POST /brain/code/index.)';
    const prompt = CODE_RAG_PROMPT.replace('{{context}}', contextStr).replace(
      '{{question}}',
      question,
    );
    return this.llm.generate(DEFAULT_LLM_MODEL, prompt);
  }
}
