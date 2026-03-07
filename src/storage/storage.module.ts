import { Global, Module } from '@nestjs/common';
import { PathService } from './path.service';
import { FileService } from './file.service';
import { S3Service } from './s3.service';

@Global()
@Module({
  providers: [PathService, FileService, S3Service],
  exports: [PathService, FileService, S3Service],
})
export class StorageModule {}
