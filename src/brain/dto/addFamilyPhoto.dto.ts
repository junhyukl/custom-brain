export class AddFamilyPhotoDto {
  /** 사진 파일 경로 */
  filePath!: string;
  /** 관련 가족 (기본값: all) */
  person?: string;
}
