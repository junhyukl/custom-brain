import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestRunnerService } from './test-runner.service';
import { MongoModule } from './mongo/mongo.module';
import { VectorModule } from './vector/vector.module';
import { LlmModule } from './llm/llm.module';
import { VisionModule } from './vision/vision.module';
import { StorageModule } from './storage/storage.module';
import { BrainCoreModule } from './brain-core/brain-core.module';
import { BrainModule } from './brain/brain.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { ApiModule } from './api/api.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [
    MongoModule,
    VectorModule,
    LlmModule,
    VisionModule,
    StorageModule,
    BrainCoreModule,
    BrainModule,
    IngestionModule,
    ApiModule,
    ToolsModule,
  ],
  controllers: [AppController],
  providers: [AppService, TestRunnerService],
})
export class AppModule {}
