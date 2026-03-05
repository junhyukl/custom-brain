import { Global, Module } from '@nestjs/common';
import { VectorStore } from './vectorStore';

@Global()
@Module({
  providers: [VectorStore],
  exports: [VectorStore],
})
export class VectorModule {}
