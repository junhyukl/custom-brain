import path from 'path';
import axios from 'axios';
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
import { MAX_UPLOAD_BYTES } from '../common/constants';

const UPLOAD_400_HINT =
  '서버 내부 400 (Ollama 이미지/임베딩 또는 Qdrant). pnpm run clear-timeline 후 재시도하거나, Ollama(llava·nomic-embed-text) 및 Qdrant 상태를 확인하세요.';

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
      limits: { fileSize: MAX_UPLOAD_BYTES },
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
      let message = toErrorMessage(err);
      console.error('[brain/upload/photo] fileSize=%s', fileSize, err instanceof Error ? err.stack : message);
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        message = UPLOAD_400_HINT;
      }
      return { success: false, error: message };
    }
  }

  @Post('document')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES },
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
        return {
          success: false,
          error: '텍스트 추출에 실패했거나 내용이 비어 있습니다. (지원: PDF/DOCX/TXT/MD. 스캔된 PDF는 텍스트 레이어가 없으면 실패할 수 있습니다.)',
        };
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
