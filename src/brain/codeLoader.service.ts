import { Injectable } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { CODE_LOADER_EXTENSIONS, CODE_SKIP_DIRS } from '../common/constants';
import type { LoadedFile } from './types/code.types';

@Injectable()
export class CodeLoaderService {
  /**
   * 프로젝트 디렉터리에서 지정 확장자 파일을 재귀적으로 읽습니다.
   * node_modules, dist, .git 등은 제외합니다.
   */
  async loadProjectFiles(
    dirPath: string,
    exts: string[] = CODE_LOADER_EXTENSIONS,
  ): Promise<LoadedFile[]> {
    const files: LoadedFile[] = [];
    const skipSet = new Set(CODE_SKIP_DIRS);

    const readDir = async (dir: string) => {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!skipSet.has(entry.name)) await readDir(fullPath);
        } else if (exts.includes(extname(entry.name))) {
          try {
            const content = await readFile(fullPath, 'utf-8');
            files.push({ path: fullPath, content });
          } catch {
            // skip binary or unreadable
          }
        }
      }
    };

    await readDir(dirPath);
    return files;
  }
}
