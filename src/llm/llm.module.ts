import { Global, Module } from '@nestjs/common';
import { LlmClient } from './llmClient';

@Global()
@Module({
  providers: [LlmClient],
  exports: [LlmClient],
})
export class LlmModule {}
