import { Injectable } from '@nestjs/common';
import { RouterService } from './router.service';
import { ModelService } from './model.service';
import { MemoryService } from './memory.service';

@Injectable()
export class BrainService {
  constructor(
    private readonly router: RouterService,
    private readonly model: ModelService,
    private readonly memory: MemoryService,
  ) {}

  async handle(prompt: string) {
    const memories = await this.memory.recall();

    const injectedPrompt = `
You are a personalized AI assistant.

Relevant memory:
${JSON.stringify(memories)}

User: ${prompt}
`;

    const selectedModel = this.router.selectModel(prompt);
    const response = await this.model.generate(selectedModel, injectedPrompt);

    return { response, model: selectedModel };
  }
}
