import { Module } from '@nestjs/common';
import { BrainCoreModule } from '../brain-core/brain-core.module';
import { BrainModule } from '../brain/brain.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { Neo4jModule } from '../neo4j/neo4j.module';
import { AiServiceModule } from '../ai-service/ai-service.module';
import { MemoryController } from './memory.controller';
import { SearchController } from './search.controller';
import { TimelineController } from './timeline.controller';
import { PhotoController } from './photo.controller';
import { FamilyController } from './family.controller';
import { FileController } from './file.controller';
import { FaceController } from './face.controller';

@Module({
  imports: [BrainCoreModule, BrainModule, IngestionModule, Neo4jModule, AiServiceModule],
  controllers: [
    MemoryController,
    SearchController,
    TimelineController,
    PhotoController,
    FamilyController,
    FileController,
    FaceController,
  ],
})
export class ApiModule {}
