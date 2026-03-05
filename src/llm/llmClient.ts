import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LlmClient {
  private readonly baseUrl = 'http://localhost:11434';

  async generate(model: string, prompt: string, options?: { stream?: boolean }): Promise<string> {
    const { data } = await axios.post<{ response: string }>(
      `${this.baseUrl}/api/generate`,
      { model, prompt, stream: options?.stream ?? false },
    );
    return data.response;
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
}
