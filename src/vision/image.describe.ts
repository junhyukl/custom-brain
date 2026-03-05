import { Injectable } from '@nestjs/common';
import { LlmClient } from '../llm/llmClient';
import { VISION_MODEL } from '../common/constants';

const DEFAULT_PROMPT =
  'Describe this photo for a family memory in one or two sentences. Include: place, approximate year if visible, and who or what is in the photo. Use simple language.';

@Injectable()
export class ImageDescribeService {
  constructor(private readonly llm: LlmClient) {}

  async describe(imageBase64: string, prompt = DEFAULT_PROMPT): Promise<string> {
    const text = await this.llm.generateWithImage(VISION_MODEL, prompt, imageBase64);
    return text.trim() || 'Photo (no description generated)';
  }
}
