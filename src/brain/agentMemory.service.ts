import { Injectable } from '@nestjs/common';

@Injectable()
export class AgentMemoryService {
  private readonly buffer: Array<{ role: string; content: string }> = [];

  append(role: string, content: string): void {
    this.buffer.push({ role, content });
  }

  getMessages(): Array<{ role: string; content: string }> {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer.length = 0;
  }
}
