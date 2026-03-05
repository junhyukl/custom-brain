import { Module } from '@nestjs/common';
import { MongoModule } from '../mongo/mongo.module';
import { VectorModule } from '../vector/vector.module';
import { MemoryService } from './memory.service';
import { EmbeddingService } from './embedding.service';
import { SearchService } from './search.service';
import { TimelineService } from './timeline.service';

@Module({
  imports: [MongoModule, VectorModule],
  providers: [MemoryService, EmbeddingService, SearchService, TimelineService],
  exports: [MemoryService, EmbeddingService, SearchService, TimelineService],
})
export class BrainCoreModule {}
