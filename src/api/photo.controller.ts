import { Body, Controller, Post } from '@nestjs/common';
import { PhotoIngestService } from '../ingestion/photo.ingest';
import { AnalyzePhotoDto } from '../brain/dto';

@Controller('brain')
export class PhotoController {
  constructor(private readonly photoIngest: PhotoIngestService) {}

  @Post('photo/analyze')
  async analyze(@Body() body: AnalyzePhotoDto) {
    return this.photoIngest.ingestPhoto(body.image, {
      filePath: body.source,
      date: body.date,
      people: body.people,
    });
  }
}
