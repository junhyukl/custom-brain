import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { S3Service } from '../storage/s3.service';
import { STORAGE_CONFIG } from '../config/storage.config';

/**
 * S3에 저장된 파일 접근: GET /brain/file?key=personal/photos/xxx.jpg → 302 presigned URL.
 * S3 미사용 시 404.
 */
@Controller('brain')
export class FileController {
  constructor(private readonly s3: S3Service) {}

  @Get('file')
  async getFile(@Query('key') key: string | undefined, @Res() res: Response): Promise<void> {
    if (!key?.trim() || !STORAGE_CONFIG.useS3) {
      res.status(404).end();
      return;
    }
    const url = await this.s3.getPresignedUrl(key.trim(), 3600);
    if (!url) {
      res.status(404).end();
      return;
    }
    res.redirect(302, url);
  }
}
