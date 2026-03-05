import { Global, Module } from '@nestjs/common';
import { ImageDescribeService } from './image.describe';
import { OcrService } from './ocr.service';

@Global()
@Module({
  providers: [ImageDescribeService, OcrService],
  exports: [ImageDescribeService, OcrService],
})
export class VisionModule {}
