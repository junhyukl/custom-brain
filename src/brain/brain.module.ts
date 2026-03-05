import { Module } from '@nestjs/common';
import { BrainCoreModule } from '../brain-core/brain-core.module';
import { MemoryEvaluatorService } from './memoryEvaluator.service';
import { AskBrainService } from './askBrain.service';
import { RagService } from './rag.service';
import { AgentMemoryService } from './agentMemory.service';
import { FamilyService } from './family.service';
import { PhotoAnalyzeService } from './photo-analyze.service';
import { BrainRoutes } from '../routes/brain.routes';
import { LlmModule } from '../llm/llm.module';
import { MongoModule } from '../mongo/mongo.module';

@Module({
  imports: [BrainCoreModule, LlmModule, MongoModule],
  controllers: [BrainRoutes],
  providers: [
    MemoryEvaluatorService,
    AskBrainService,
    RagService,
    AgentMemoryService,
    FamilyService,
    PhotoAnalyzeService,
  ],
  exports: [
    MemoryEvaluatorService,
    AskBrainService,
    RagService,
    AgentMemoryService,
    FamilyService,
    PhotoAnalyzeService,
  ],
})
export class BrainModule {}
