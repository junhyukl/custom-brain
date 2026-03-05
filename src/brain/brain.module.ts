import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { MemoryEvaluatorService } from './memoryEvaluator.service';
import { AskBrainService } from './askBrain.service';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';
import { AgentMemoryService } from './agentMemory.service';
import { MongoQueryService } from './mongoQuery.service';
import { MongoExplainService } from './mongoExplain.service';
import { CodeLoaderService } from './codeLoader.service';
import { CodeParserService } from './codeParser.service';
import { CodeMemoryService } from './codeMemory.service';
import { CodeRagService } from './codeRag.service';
import { CodeIndexService } from './codeIndex.service';
import { FamilyMemoryService } from './familyMemory.service';
import { BrainRoutes } from '../routes/brain.routes';
import { VectorModule } from '../vector/vector.module';
import { LlmModule } from '../llm/llm.module';
import { DatabaseModule } from '../db/database.module';

@Module({
  imports: [VectorModule, LlmModule, DatabaseModule],
  controllers: [BrainRoutes],
  providers: [
    MemoryService,
    MemoryEvaluatorService,
    AskBrainService,
    EmbeddingService,
    RagService,
    AgentMemoryService,
    MongoQueryService,
    MongoExplainService,
    CodeLoaderService,
    CodeParserService,
    CodeMemoryService,
    CodeRagService,
    CodeIndexService,
    FamilyMemoryService,
  ],
  exports: [
    MemoryService,
    MemoryEvaluatorService,
    AskBrainService,
    EmbeddingService,
    RagService,
    AgentMemoryService,
    MongoQueryService,
    MongoExplainService,
    CodeLoaderService,
    CodeParserService,
    CodeMemoryService,
    CodeRagService,
    CodeIndexService,
    FamilyMemoryService,
  ],
})
export class BrainModule {}
