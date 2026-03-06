import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import { LlmClient } from '../llm/llmClient';
import { VISION_MODEL } from '../common/constants';
import { resizeForVision } from './image.resize';

const DEFAULT_PROMPT =
  'Describe this photo for a family memory in one or two sentences. Include: place, approximate year if visible, and who or what is in the photo. Use simple language.';

/** 검색 인덱싱용 상세 캡션 (업로드·ingest 시 사용). llava → embedding → Qdrant 검색 품질 향상. */
export const SEARCH_CAPTION_PROMPT = `Describe this image for a personal photo search engine.
Include:
- people (who is in the photo)
- location or setting
- activities (what they are doing)
- objects (notable items)
- mood or emotions if visible
Use one or two clear sentences in the same language as the user's content.`;

@Injectable()
export class ImageDescribeService {
  constructor(private readonly llm: LlmClient) {}

  async describe(imageBase64: string, prompt = DEFAULT_PROMPT): Promise<string> {
    const text = await this.llm.generateWithImage(VISION_MODEL, prompt, imageBase64);
    return text.trim() || 'Photo (no description generated)';
  }

  /** Read image, resize for Vision API limit, then describe. useSearchPrompt=true 시 검색용 캡션. */
  async describeFromPath(filePath: string, useSearchPrompt = true): Promise<string> {
    const buf = await fs.readFile(filePath);
    const resized = await resizeForVision(buf);
    const base64 = resized.toString('base64');
    const prompt = useSearchPrompt ? SEARCH_CAPTION_PROMPT : DEFAULT_PROMPT;
    return this.describe(base64, prompt);
  }
}
