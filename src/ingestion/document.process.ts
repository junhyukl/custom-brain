import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { extractTextFromPDF } from '../vision/pdf.ocr';
import { extractTextFromDocx } from '../vision/docx.ocr';
import { MemoryService } from '../brain-core/memory.service';

const DOC_EXT = {
  pdf: (p: string) => extractTextFromPDF(p),
  docx: (p: string) => extractTextFromDocx(p),
  txt: async (p: string) => (await fs.readFile(p, 'utf-8')).trim(),
  md: async (p: string) => (await fs.readFile(p, 'utf-8')).trim(),
};

const SCANNED_PDF_PLACEHOLDER =
  '스캔된 문서 (이미지 기반 PDF). 텍스트 레이어가 없어 내용 검색은 불가하며, 파일만 저장됩니다.';

export interface ProcessDocumentResult {
  memoryId: string;
  contentLength: number;
}

/**
 * Document pipeline: extract text (PDF/DOCX/TXT/MD) → store as Memory (embed + Qdrant + Mongo).
 */
@Injectable()
export class DocumentProcessService {
  constructor(private readonly memory: MemoryService) {}

  /** 텍스트만 추출 (저장 없음). PDF/DOCX/TXT/MD 지원. */
  async extractText(filePath: string): Promise<string | null> {
    const resolvedPath = path.resolve(filePath);
    const ext = path.extname(resolvedPath).toLowerCase().slice(1);
    const extract = DOC_EXT[ext as keyof typeof DOC_EXT];
    if (!extract) return null;
    try {
      const content = await extract(resolvedPath);
      return content && content.length >= 2 ? content : null;
    } catch {
      return null;
    }
  }

  async processDocument(
    filePath: string,
    scope: 'personal' | 'family',
    options?: { metadataFilePath?: string },
  ): Promise<ProcessDocumentResult | null> {
    const resolvedPath = path.resolve(filePath);
    const metaPath = options?.metadataFilePath ?? resolvedPath;
    const ext = path.extname(resolvedPath).toLowerCase().slice(1);
    const extract = DOC_EXT[ext as keyof typeof DOC_EXT];
    if (!extract) return null;

    let content: string;
    try {
      content = await extract(resolvedPath);
    } catch (err) {
      console.warn('[document.process] extract failed:', path.basename(resolvedPath), err instanceof Error ? err.message : err);
      if (ext === 'pdf') return this.storeDocumentPlaceholder(scope, SCANNED_PDF_PLACEHOLDER, metaPath);
      return null;
    }
    if (!content || content.length < 2) {
      console.warn('[document.process] content empty or too short:', path.basename(resolvedPath), 'length=', content?.length ?? 0);
      if (ext === 'pdf') return this.storeDocumentPlaceholder(scope, SCANNED_PDF_PLACEHOLDER, metaPath);
      return null;
    }

    const memory = await this.memory.store(content.slice(0, 100_000), {
      type: 'document',
      scope,
      metadata: { filePath: metaPath },
    });
    return { memoryId: memory.id, contentLength: content.length };
  }

  /** 스캔된 PDF 등 텍스트가 없을 때 파일만 저장하고 메모리에는 설명만 등록 */
  private async storeDocumentPlaceholder(
    scope: 'personal' | 'family',
    placeholderContent: string,
    filePathForMetadata: string,
  ): Promise<ProcessDocumentResult> {
    const memory = await this.memory.store(placeholderContent, {
      type: 'document',
      scope,
      metadata: { filePath: filePathForMetadata },
    });
    return { memoryId: memory.id, contentLength: placeholderContent.length };
  }
}
