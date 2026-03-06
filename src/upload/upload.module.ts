import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [IngestionModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
