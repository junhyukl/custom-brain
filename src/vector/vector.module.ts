import { Global, Module } from '@nestjs/common';
import { VectorStore } from './vectorStore';
import { QdrantClient } from './qdrant.client';
import { VectorService } from './vector.service';

@Global()
@Module({
  providers: [
    QdrantClient,
    VectorService,
    { provide: VectorStore, useExisting: QdrantClient },
  ],
  exports: [VectorStore, QdrantClient, VectorService],
})
export class VectorModule {}
