import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ModelService {
  async generate(model: string, prompt: string): Promise<string> {
    const { data } = await axios.post<{ response: string }>(
      'http://localhost:11434/api/generate',
      { model, prompt, stream: false },
    );
    return data.response;
  }
}
