import { Module } from '@nestjs/common';
import { BrainCoreModule } from '../brain-core/brain-core.module';
import { VisionModule } from '../vision/vision.module';
import { PhotoIngestService } from './photo.ingest';
import { PhotoProcessService } from './photo.process';
import { DocumentIngestService } from './document.ingest';
import { EmailIngestService } from './email.ingest';

@Module({
  imports: [BrainCoreModule, VisionModule],
  providers: [
    PhotoIngestService,
    PhotoProcessService,
    DocumentIngestService,
    EmailIngestService,
  ],
  exports: [
    PhotoIngestService,
    PhotoProcessService,
    DocumentIngestService,
    EmailIngestService,
  ],
})
export class IngestionModule {}
