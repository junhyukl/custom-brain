import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OLLAMA_URL } from '../common/constants';
import { LlmClient } from './llmClient';

@Injectable()
export class OllamaClient extends LlmClient {
  private readonly baseUrl = OLLAMA_URL;

  async generate(model: string, prompt: string, options?: { stream?: boolean }): Promise<string> {
    const { data } = await axios.post<{ response: string }>(
      `${this.baseUrl}/api/generate`,
      { model, prompt, stream: options?.stream ?? false },
    );
    return data.response ?? '';
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const { data } = await axios.post<{ message: { content: string } }>(
      `${this.baseUrl}/api/chat`,
      { model, messages, stream: false },
    );
    return data.message?.content ?? '';
  }

  async generateWithImage(model: string, prompt: string, imageBase64: string): Promise<string> {
    const { data } = await axios.post<{ response: string }>(
      `${this.baseUrl}/api/generate`,
      { model, prompt, images: [imageBase64], stream: false },
    );
    return data.response ?? '';
  }
}
