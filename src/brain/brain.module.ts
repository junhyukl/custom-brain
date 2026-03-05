import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { MemoryEvaluatorService } from './memoryEvaluator.service';
import { AskBrainService } from './askBrain.service';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';
import { AgentMemoryService } from './agentMemory.service';
import { BrainRoutes } from '../routes/brain.routes';
import { VectorModule } from '../vector/vector.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [VectorModule, LlmModule],
  controllers: [BrainRoutes],
  providers: [
    MemoryService,
    MemoryEvaluatorService,
    AskBrainService,
    EmbeddingService,
    RagService,
    AgentMemoryService,
  ],
  exports: [
    MemoryService,
    MemoryEvaluatorService,
    AskBrainService,
    EmbeddingService,
    RagService,
    AgentMemoryService,
  ],
})
export class BrainModule {}
