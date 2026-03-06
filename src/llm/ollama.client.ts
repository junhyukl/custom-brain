import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { OLLAMA_URL } from '../common/constants';
import { LlmClient } from './llmClient';

function wrapOllamaApiError(err: unknown, context: string): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    const msg =
      (typeof data === 'string' ? data : (data as { error?: string })?.error) ?? err.message;
    if (status === 404) {
      throw new Error(
        `${context}: Ollama가 응답하지 않거나 해당 모델이 없습니다(404). 'ollama serve' 실행 후 'ollama pull <모델명>'으로 모델을 받으세요. (${msg})`,
      );
    }
    if (status === 400) {
      throw new Error(
        `${context}: Ollama가 요청을 거부했습니다(400). 이미지 해상도/용량이 클 수 있습니다. (${msg})`,
      );
    }
    throw new Error(`${context}: ${msg}`);
  }
  throw err;
}

@Injectable()
export class OllamaClient extends LlmClient {
  private readonly baseUrl = OLLAMA_URL;

  async generate(model: string, prompt: string, options?: { stream?: boolean }): Promise<string> {
    try {
      const { data } = await axios.post<{ response: string }>(
        `${this.baseUrl}/api/generate`,
        { model, prompt, stream: options?.stream ?? false },
      );
      return data.response ?? '';
    } catch (err) {
      wrapOllamaApiError(err, `Ollama generate(${model})`);
    }
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    try {
      const { data } = await axios.post<{ message: { content: string } }>(
        `${this.baseUrl}/api/chat`,
        { model, messages, stream: false },
      );
      return data.message?.content ?? '';
    } catch (err) {
      wrapOllamaApiError(err, `Ollama chat(${model})`);
    }
  }

  async generateWithImage(model: string, prompt: string, imageBase64: string): Promise<string> {
    try {
      const { data } = await axios.post<{ response: string }>(
        `${this.baseUrl}/api/generate`,
        { model, prompt, images: [imageBase64], stream: false },
      );
      return data.response ?? '';
    } catch (err) {
      wrapOllamaApiError(err, `Ollama vision(${model})`);
    }
  }
}
