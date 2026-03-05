import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import path from 'path';
import { PathService } from './path.service';

@Injectable()
export class FileService {
  constructor(private readonly pathService: PathService) {}

  async readFile(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
  }

  async readFileAsBase64(filePath: string): Promise<string> {
    const buf = await this.readFile(filePath);
    return buf.toString('base64');
  }

  async writeFile(filePath: string, content: Buffer | string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
  }

  async listDir(dirPath: string, ext?: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const names = entries.filter((e) => e.isFile()).map((e) => e.name);
    if (ext) return names.filter((n) => n.endsWith(ext));
    return names;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
