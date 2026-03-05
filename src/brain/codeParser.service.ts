import { Injectable } from '@nestjs/common';
import type { LoadedFile, ParsedChunk } from './types/code.types';

@Injectable()
export class CodeParserService {
  /**
   * 로드된 파일을 파싱해 파일 단위 청크로 반환합니다.
   * (추후 함수/클래스 단위 분할 확장 가능)
   */
  parseCodeFiles(files: LoadedFile[]): ParsedChunk[] {
    return files.map((f) => ({
      filePath: f.path,
      text: f.content,
    }));
  }
}
