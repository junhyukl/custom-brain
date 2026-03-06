import { Global, Module } from '@nestjs/common';
import { VectorModule } from '../vector/vector.module';
import { ImageDescribeService } from './image.describe';
import { OcrService } from './ocr.service';
import { FaceService } from './face.service';

@Global()
@Module({
  imports: [VectorModule],
  providers: [ImageDescribeService, OcrService, FaceService],
  exports: [ImageDescribeService, OcrService, FaceService],
})
export class VisionModule {}
