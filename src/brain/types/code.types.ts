/** 코드 로더가 반환하는 파일 단위 */
export interface LoadedFile {
  path: string;
  content: string;
}

/** 파서가 만드는 청크 (파일 또는 함수/클래스 단위) */
export interface ParsedChunk {
  filePath: string;
  text: string;
}

/** 코드 벡터 검색 결과 한 건 */
export interface CodeSearchResult {
  filePath: string;
  text: string;
  score: number;
}
