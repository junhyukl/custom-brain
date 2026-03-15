import path from 'path';
import fs from 'fs';
import { Body, Controller, Get, Post, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { FamilyService } from '../brain/family.service';
import { FamilyGraphService } from '../neo4j/family-graph.service';
import { CreatePersonDto } from '../brain/dto';
import { toErrorMessage } from '../common/error.util';
import type { FamilyTreeEntry, FamilyGraphResponse } from '../brain/family.service';
import type { Person } from '../schemas';
import { PhotoProcessService } from '../ingestion/photo.process';
import { DocumentProcessService } from '../ingestion/document.process';
import { AiServiceClient } from '../ai-service/ai-service.client';
import { MemoryService } from '../brain-core/memory.service';
import { STORAGE_CONFIG } from '../config/storage.config';

@Controller('brain')
export class FamilyController {
  constructor(
    private readonly family: FamilyService,
    private readonly familyGraph: FamilyGraphService,
    private readonly photoProcess: PhotoProcessService,
    private readonly documentProcess: DocumentProcessService,
    private readonly aiService: AiServiceClient,
    private readonly memory: MemoryService,
  ) {}

  @Get('family/graph')
  async getGraph(): Promise<{ graph: FamilyGraphResponse; error?: string }> {
    try {
      const graph = await this.family.getGraph();
      return { graph };
    } catch (err) {
      const message = toErrorMessage(err);
      return { graph: { nodes: [], edges: [] }, error: message };
    }
  }

  @Get('family/tree')
  async getTree(): Promise<{ tree: FamilyTreeEntry[]; error?: string }> {
    try {
      const tree = await this.family.getTree();
      return { tree };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/family/tree]', message);
      return { tree: [], error: message };
    }
  }

  @Post('family/persons')
  async createPerson(@Body() body: CreatePersonDto): Promise<Person> {
    try {
      return await this.family.createPerson(body);
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/family/persons]', message);
      throw new HttpException({ error: message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /** Voice 추론 등으로 가족 관계 추가. (Person)-[:relation]->(Person). ai_family_system 연동. */
  @Post('family/graph/relation')
  async addGraphRelation(
    @Body() body: { from?: string; relation?: string; to?: string },
  ): Promise<{ ok: boolean; error?: string }> {
    const fromName = body?.from?.trim();
    const toName = body?.to?.trim();
    const relation = body?.relation?.trim();
    if (!fromName || !toName || !relation) {
      return { ok: false, error: 'from, relation, to required' };
    }
    try {
      await this.familyGraph.addRelation(fromName, relation, toName);
      return { ok: true };
    } catch (err) {
      const message = toErrorMessage(err);
      return { ok: false, error: message };
    }
  }

  /** 가족 사진 1건 추가: filePath(경로) → Vision/LLM 설명 → 저장. person 있으면 해당 인물 연결. */
  @Post('family/addPhoto')
  async addPhoto(
    @Body() body: { filePath?: string; person?: string },
  ): Promise<{ success: true; memoryId: string } | { success: false; error: string }> {
    const filePath = body?.filePath?.trim();
    if (!filePath) {
      return { success: false, error: 'filePath required' };
    }
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(STORAGE_CONFIG.root, filePath);
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, error: 'File not found: ' + filePath };
    }
    try {
      const result = await this.photoProcess.processPhoto(resolvedPath, 'family', {
        metadataFilePath: resolvedPath,
      });
      if (body.person?.trim()) {
        await this.familyGraph.linkPersonToPhoto(body.person.trim(), result.memoryId);
      }
      return { success: true, memoryId: result.memoryId };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/family/addPhoto]', message);
      return { success: false, error: message };
    }
  }

  /** 가족 문서 1건 추가: filePath(경로) → PDF/TXT/MD 텍스트 추출 → 요약(ai-service) → 저장. person 있으면 metadata.people에 포함. */
  @Post('family/addDocument')
  async addDocument(
    @Body() body: { filePath?: string; person?: string },
  ): Promise<{ success: true; memoryId: string } | { success: false; error: string }> {
    const filePath = body?.filePath?.trim();
    if (!filePath) {
      return { success: false, error: 'filePath required' };
    }
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(STORAGE_CONFIG.root, filePath);
    if (!fs.existsSync(resolvedPath)) {
      return { success: false, error: 'File not found: ' + filePath };
    }
    try {
      const text = await this.documentProcess.extractText(resolvedPath);
      if (!text) {
        return { success: false, error: 'Unsupported format or empty content (PDF/DOCX/TXT/MD)' };
      }
      const toStore = text.slice(0, 100_000);
      let content = toStore;
      if (this.aiService.isAvailable()) {
        try {
          const summary = await this.aiService.summarize([toStore.slice(0, 30_000)]);
          if (summary?.trim()) content = summary.trim();
        } catch {
          // fallback: store full text
        }
      }
      const people = body.person?.trim() ? [body.person.trim()] : undefined;
      const memory = await this.memory.store(content, {
        type: 'document',
        scope: 'family',
        metadata: { filePath: resolvedPath, people },
      });
      return { success: true, memoryId: memory.id };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/family/addDocument]', message);
      return { success: false, error: message };
    }
  }
}
