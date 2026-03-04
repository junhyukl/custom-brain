import { Injectable } from '@nestjs/common';

@Injectable()
export class RouterService {
  selectModel(prompt: string): string {
    if (/code|typescript|mongodb|function/i.test(prompt)) {
      return 'qwen2.5:7b-instruct';
    }
    if (/analyze|reason|complex/i.test(prompt)) {
      return 'llama3.1:8b-instruct';
    }
    return 'mistral:7b-instruct';
  }
}
