import { Injectable } from '@nestjs/common';
import type { Memory } from '../brain-schema';

@Injectable()
export class PromptService {
  buildRagContext(memories: Memory[]): string {
    if (!memories.length) return '(no relevant memories)';
    return memories.map((m) => m.content).filter(Boolean).join('\n---\n');
  }

  buildRagPrompt(context: string, question: string): string {
    return `Context:\n${context}\n\nQuestion:\n${question}\n\nAnswer based on the context above. If the context is empty, answer from general knowledge.`;
  }

  buildImportancePrompt(content: string): string {
    return `Should this be saved as knowledge?\n\n${content}\n\nAnswer YES or NO.`;
  }
}
