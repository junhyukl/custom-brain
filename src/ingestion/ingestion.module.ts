import { Module } from '@nestjs/common';
import { BrainCoreModule } from '../brain-core/brain-core.module';
import { BrainModule } from '../brain/brain.module';
import { VisionModule } from '../vision/vision.module';
import { PhotoIngestService } from './photo.ingest';
import { PhotoProcessService } from './photo.process';
import { DocumentIngestService } from './document.ingest';
import { DocumentProcessService } from './document.process';
import { EmailIngestService } from './email.ingest';

@Module({
  imports: [BrainCoreModule, BrainModule, VisionModule],
  providers: [
    PhotoIngestService,
    PhotoProcessService,
    DocumentIngestService,
    DocumentProcessService,
    EmailIngestService,
  ],
  exports: [
    PhotoIngestService,
    PhotoProcessService,
    DocumentIngestService,
    DocumentProcessService,
    EmailIngestService,
  ],
})
export class IngestionModule {}
