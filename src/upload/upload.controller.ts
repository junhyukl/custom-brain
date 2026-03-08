import path from 'path';
import axios from 'axios';
import {
  Body,
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
import { AiServiceClient } from '../ai-service/ai-service.client';
import { MemoryService } from '../brain-core/memory.service';
import { FamilyGraphService } from '../neo4j/family-graph.service';
import { toErrorMessage } from '../common/error.util';
import { extractRelationsFromText } from '../common/relation-extract.util';
import { MAX_UPLOAD_BYTES, UPLOAD_400_HINT, UPLOAD_NO_FILE_MSG } from '../common/constants';

const FILE_UPLOAD_OPTIONS = { limits: { fileSize: MAX_UPLOAD_BYTES } } as const;

type UploadedFilePayload = { buffer: Buffer; originalname: string } | undefined;

@Controller('brain/upload')
export class UploadController {
  constructor(
    private readonly upload: UploadService,
    private readonly photoProcess: PhotoProcessService,
    private readonly documentProcess: DocumentProcessService,
    private readonly aiService: AiServiceClient,
    private readonly memory: MemoryService,
    private readonly familyGraph: FamilyGraphService,
  ) {}

  private assertFile(file: UploadedFilePayload): asserts file is { buffer: Buffer; originalname: string } {
    if (!file?.buffer) throw new BadRequestException(UPLOAD_NO_FILE_MSG);
  }

  @Post('photo')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  async uploadPhoto(
    @UploadedFile() file: UploadedFilePayload,
  ): Promise<
    | { success: true; memoryId: string; filePath: string }
    | { success: false; error: string }
  > {
    this.assertFile(file);
    const fileSize = file.buffer.length;
    try {
      const { pathForProcessing, filePathForMetadata } = await this.upload.saveFile(
        file.buffer,
        file.originalname,
        'photo',
      );
      const result = await this.photoProcess.processPhoto(pathForProcessing, 'personal', {
        metadataFilePath: filePathForMetadata,
      });
      await this.upload.cleanupTempPath(pathForProcessing);
      const displayName = filePathForMetadata.includes('/') ? path.basename(filePathForMetadata) : path.basename(pathForProcessing);
      return { success: true, memoryId: result.memoryId, filePath: displayName };
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
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  async uploadDocument(
    @UploadedFile() file: UploadedFilePayload,
  ): Promise<
    | { success: true; memoryId: string; contentLength: number }
    | { success: false; error: string }
  > {
    this.assertFile(file);
    try {
      const { pathForProcessing, filePathForMetadata } = await this.upload.saveFile(
        file.buffer,
        file.originalname,
        'document',
      );
      const result = await this.documentProcess.processDocument(pathForProcessing, 'personal', {
        metadataFilePath: filePathForMetadata,
      });
      await this.upload.cleanupTempPath(pathForProcessing);
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

  @Post('voice')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', FILE_UPLOAD_OPTIONS))
  async uploadVoice(
    @UploadedFile() file: UploadedFilePayload,
    @Body() body: { speaker?: string },
  ): Promise<
    | { success: true; memoryId: string; filePath?: string; textLength: number }
    | { success: false; error: string }
  > {
    this.assertFile(file);
    if (!this.aiService.isAvailable()) {
      return {
        success: false,
        error: '음성 인식 서비스를 사용할 수 없습니다. AI_SERVICE_URL을 설정하고 ai-service(Whisper)를 실행하세요.',
      };
    }
    try {
      const { pathForProcessing, filePathForMetadata } = await this.upload.saveFile(
        file.buffer,
        file.originalname,
        'voice',
      );
      const speaker = typeof body?.speaker === 'string' ? body.speaker.trim() : undefined;
      const { text: textFromSpeakers, segments } = await this.aiService.transcribeWithSpeakers(
        pathForProcessing,
      );
      let text = textFromSpeakers;
      if (!text || text.length < 2) {
        text = await this.aiService.transcribe(pathForProcessing);
      }
      await this.upload.cleanupTempPath(pathForProcessing);
      if (!text || text.length < 2) {
        return {
          success: false,
          error: '음성에서 텍스트를 추출하지 못했습니다. 파일 형식과 내용을 확인하세요.',
        };
      }
      const speakersFromDiarization =
        segments?.length && !speaker
          ? [...new Set(segments.map((s) => s.speaker))].slice(0, 5)
          : undefined;
      const memory = await this.memory.store(text, {
        type: 'voice',
        scope: 'personal',
        metadata: {
          filePath: filePathForMetadata,
          ...(speaker ? { speaker } : {}),
          ...(speakersFromDiarization?.length ? { speakers: speakersFromDiarization } : {}),
        },
      });
      if (speaker) {
        await this.familyGraph.linkPersonToVoice(speaker, memory.id);
        const relations = extractRelationsFromText(speaker, text);
        for (const r of relations) {
          await this.familyGraph.addRelation(r.from, r.relation, r.to);
        }
      }
      return {
        success: true,
        memoryId: memory.id,
        filePath: path.basename(filePathForMetadata),
        textLength: text.length,
      };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/upload/voice]', message);
      return { success: false, error: message };
    }
  }
}
