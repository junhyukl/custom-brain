import { Global, Module } from '@nestjs/common';
import { LlmClient } from './llmClient';
import { OllamaClient } from './ollama.client';
import { PromptService } from './prompt.service';

@Global()
@Module({
  providers: [
    OllamaClient,
    PromptService,
    { provide: LlmClient, useExisting: OllamaClient },
  ],
  exports: [LlmClient, OllamaClient, PromptService],
})
export class LlmModule {}
