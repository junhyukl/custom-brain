import { Module } from '@nestjs/common';
import { BrainCoreModule } from '../brain-core/brain-core.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { AiServiceModule } from '../ai-service/ai-service.module';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { BatchUploadScheduleService } from './batch-upload-schedule.service';

@Module({
  imports: [IngestionModule, BrainCoreModule, AiServiceModule, Neo4jModule],
  controllers: [UploadController],
  providers: [UploadService, BatchUploadScheduleService],
  exports: [UploadService],
})
export class UploadModule {}
