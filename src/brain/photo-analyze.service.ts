import { Injectable } from '@nestjs/common';
import { LlmClient } from '../llm/llmClient';
import { MemoryService } from '../brain-core/memory.service';
import { VISION_MODEL } from '../common/constants';

@Injectable()
export class PhotoAnalyzeService {
  constructor(
    private readonly llm: LlmClient,
    private readonly memory: MemoryService,
  ) {}

  /**
   * 사진 분석 → 설명 생성 → 메모리 저장 (type: photo, scope: family)
   * imageBase64: data URL 제거된 순수 base64 문자열
   */
  async analyzeAndStore(
    imageBase64: string,
    options?: { date?: string; source?: string; people?: string[] },
  ): Promise<{ description: string; memoryId: string }> {
    const prompt = `Describe this photo for a family memory in one or two sentences. Include: place, approximate year if visible, and who or what is in the photo. Use simple language.`;
    const description =
      (await this.llm.generateWithImage(VISION_MODEL, prompt, imageBase64)).trim() ||
      'Photo (no description generated)';
    const memory = await this.memory.store(description, {
      type: 'photo',
      scope: 'family',
      metadata: {
        date: options?.date,
        source: options?.source,
        people: options?.people,
      },
    });
    return { description, memoryId: memory.id };
  }
}
