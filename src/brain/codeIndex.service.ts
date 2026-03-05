import { Injectable } from '@nestjs/common';
import { CodeLoaderService } from './codeLoader.service';
import { CodeParserService } from './codeParser.service';
import { CodeMemoryService } from './codeMemory.service';

@Injectable()
export class CodeIndexService {
  constructor(
    private readonly codeLoader: CodeLoaderService,
    private readonly codeParser: CodeParserService,
    private readonly codeMemory: CodeMemoryService,
  ) {}

  /** 프로젝트 경로를 로드 → 파싱 → 벡터 저장 */
  async indexProject(rootPath: string): Promise<{ filesLoaded: number; chunksStored: number }> {
    const files = await this.codeLoader.loadProjectFiles(rootPath);
    const chunks = this.codeParser.parseCodeFiles(files);
    await this.codeMemory.storeCodeMemories(chunks);
    return { filesLoaded: files.length, chunksStored: chunks.length };
  }
}
