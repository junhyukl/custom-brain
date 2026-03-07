import { Module } from '@nestjs/common';
import { IngestionModule } from '../ingestion/ingestion.module';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { BatchUploadScheduleService } from './batch-upload-schedule.service';

@Module({
  imports: [IngestionModule],
  controllers: [UploadController],
  providers: [UploadService, BatchUploadScheduleService],
  exports: [UploadService],
})
export class UploadModule {}
