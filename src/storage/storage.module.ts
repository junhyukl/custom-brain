import { Global, Module } from '@nestjs/common';
import { PathService } from './path.service';
import { FileService } from './file.service';

@Global()
@Module({
  providers: [PathService, FileService],
  exports: [PathService, FileService],
})
export class StorageModule {}
