import { Injectable } from '@nestjs/common';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { MemoryService } from './memory.service';
import { LlmClient } from '../llm/llmClient';
import { DEFAULT_LLM_MODEL } from '../common/constants';

const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.txt', '.md'];

/** 사진: 경로/파일명 기반으로 LLM이 설명 생성 (이미지 비전 없음) */
const PHOTO_DESCRIPTION_PROMPT = `Given this file path for a family photo, write a short description (1-2 sentences) that could be used for search. Focus on the filename and path hints. Do not make up details. Path: {{path}}`;

/** 문서: 본문 요약 */
const DOCUMENT_SUMMARY_PROMPT = `Summarize this document for family memory in a few sentences. Keep key names, dates, and events.\n\n---\n{{text}}\n---`;

@Injectable()
export class FamilyMemoryService {
  constructor(
    private readonly memory: MemoryService,
    private readonly llm: LlmClient,
  ) {}

  /**
   * 가족 사진 추가: 파일 경로로 LLM 설명 생성 후 메모리에 저장.
   * (이미지 비전 API 없음 → 경로/파일명 기반 설명)
   */
  async addFamilyPhoto(
    filePath: string,
    person: string = 'all',
  ): Promise<{ status: string; text: string }> {
    if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const prompt = PHOTO_DESCRIPTION_PROMPT.replace('{{path}}', filePath);
    const description = await this.llm.generate(DEFAULT_LLM_MODEL, prompt);
    const text = description.trim() || `Family photo: ${filePath}`;
    await this.memory.store(text, {
      type: 'family_memory',
      person,
      source: 'photo',
      file: filePath,
    });
    return { status: 'stored', text };
  }

  /**
   * 가족 문서 추가: PDF는 텍스트 추출 후 요약, txt/md는 직접 요약 후 저장.
   */
  async addFamilyDocument(
    filePath: string,
    person: string = 'all',
  ): Promise<{ status: string; text: string }> {
    if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
    let rawText: string;

    if (ext === '.pdf') {
      rawText = await this.extractPdfText(filePath);
    } else {
      rawText = readFileSync(filePath, 'utf-8');
    }

    const truncated = rawText.slice(0, 12000);
    const prompt = DOCUMENT_SUMMARY_PROMPT.replace('{{text}}', truncated);
    const summary = await this.llm.generate(DEFAULT_LLM_MODEL, prompt);
    const text = summary.trim() || truncated.slice(0, 500);
    await this.memory.store(text, {
      type: 'family_memory',
      person,
      source: 'document',
      file: filePath,
    });
    return { status: 'stored', text };
  }

  private async extractPdfText(filePath: string): Promise<string> {
    const buffer = readFileSync(filePath);
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result?.text ?? '';
    } finally {
      await parser.destroy();
    }
  }

  /**
   * 폴더 내 사진/문서 일괄 추가. person 기본값 'all'.
   */
  async addFamilyFolder(
    folderPath: string,
    person: string = 'all',
  ): Promise<{ added: number; errors: Array<{ file: string; error: string }> }> {
    if (!existsSync(folderPath)) throw new Error(`Folder not found: ${folderPath}`);
    let added = 0;
    const errors: Array<{ file: string; error: string }> = [];
    const entries = readdirSync(folderPath);

    for (const entry of entries) {
      const fullPath = join(folderPath, entry);
      let stat: ReturnType<typeof statSync>;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      if (!stat.isFile()) continue;

      const ext = entry.toLowerCase().slice(entry.lastIndexOf('.'));
      try {
        if (PHOTO_EXTENSIONS.includes(ext)) {
          await this.addFamilyPhoto(fullPath, person);
          added++;
        } else if (DOCUMENT_EXTENSIONS.includes(ext)) {
          await this.addFamilyDocument(fullPath, person);
          added++;
        }
      } catch (err) {
        errors.push({ file: fullPath, error: String(err) });
      }
    }

    return { added, errors };
  }
}
