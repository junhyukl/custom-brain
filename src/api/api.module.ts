import { Module } from '@nestjs/common';
import { BrainCoreModule } from '../brain-core/brain-core.module';
import { BrainModule } from '../brain/brain.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { MemoryController } from './memory.controller';
import { SearchController } from './search.controller';
import { TimelineController } from './timeline.controller';
import { PhotoController } from './photo.controller';
import { FamilyController } from './family.controller';
import { FileController } from './file.controller';

@Module({
  imports: [BrainCoreModule, BrainModule, IngestionModule],
  controllers: [
    MemoryController,
    SearchController,
    TimelineController,
    PhotoController,
    FamilyController,
    FileController,
  ],
})
export class ApiModule {}
