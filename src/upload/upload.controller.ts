import path from 'path';
import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { PhotoProcessService } from '../ingestion/photo.process';
import { DocumentProcessService } from '../ingestion/document.process';
import { toErrorMessage } from '../common/error.util';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

@Controller('brain/upload')
export class UploadController {
  constructor(
    private readonly upload: UploadService,
    private readonly photoProcess: PhotoProcessService,
    private readonly documentProcess: DocumentProcessService,
  ) {}

  @Post('photo')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadPhoto(
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
  ): Promise<
    | { success: true; memoryId: string; filePath: string }
    | { success: false; error: string }
  > {
    if (!file?.buffer) {
      throw new BadRequestException('파일이 없습니다. field name은 "file" 이어야 합니다.');
    }
    const fileSize = file.buffer.length;
    try {
      const filePath = await this.upload.saveFile(file.buffer, file.originalname, 'photo');
      const result = await this.photoProcess.processPhoto(filePath, 'personal');
      return { success: true, memoryId: result.memoryId, filePath: path.basename(filePath) };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/upload/photo] fileSize=%s', fileSize, err instanceof Error ? err.stack : message);
      return { success: false, error: message };
    }
  }

  @Post('document')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: { buffer: Buffer; originalname: string } | undefined,
  ): Promise<
    | { success: true; memoryId: string; contentLength: number }
    | { success: false; error: string }
  > {
    if (!file?.buffer) {
      throw new BadRequestException('파일이 없습니다. field name은 "file" 이어야 합니다.');
    }
    try {
      const filePath = await this.upload.saveFile(file.buffer, file.originalname, 'document');
      const result = await this.documentProcess.processDocument(filePath, 'personal');
      if (!result) {
        return { success: false, error: '지원하지 않는 문서 형식이거나 텍스트 추출에 실패했습니다. (PDF/DOCX/TXT/MD)' };
      }
      return {
        success: true,
        memoryId: result.memoryId,
        contentLength: result.contentLength,
      };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/upload/document]', message);
      return { success: false, error: message };
    }
  }
}
