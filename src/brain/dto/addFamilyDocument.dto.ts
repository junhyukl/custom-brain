export class AddFamilyDocumentDto {
  /** 문서 파일 경로 (PDF, TXT, MD) */
  filePath!: string;
  /** 관련 가족 (기본값: all) */
  person?: string;
}
