import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { LlmClient } from '../llm/llmClient';
import { VISION_MODEL } from '../common/constants';

const DEFAULT_PROMPT =
  'Describe this photo for a family memory in one or two sentences. Include: place, approximate year if visible, and who or what is in the photo. Use simple language.';

const DETAIL_PROMPT = `Describe this photo in detail.
Mention people, location, and event.`;

@Injectable()
export class ImageDescribeService {
  constructor(private readonly llm: LlmClient) {}

  async describe(imageBase64: string, prompt = DEFAULT_PROMPT): Promise<string> {
    const text = await this.llm.generateWithImage(VISION_MODEL, prompt, imageBase64);
    return text.trim() || 'Photo (no description generated)';
  }

  /** Read image from file path, then describe (Vision AI). */
  async describeFromPath(filePath: string, useDetailPrompt = false): Promise<string> {
    const buf = await fs.readFile(filePath);
    const base64 = buf.toString('base64');
    const prompt = useDetailPrompt ? DETAIL_PROMPT : DEFAULT_PROMPT;
    return this.describe(base64, prompt);
  }
}
