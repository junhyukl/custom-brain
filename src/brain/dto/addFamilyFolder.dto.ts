export class AddFamilyFolderDto {
  /** 폴더 절대 경로 또는 프로젝트 기준 경로 */
  folderPath!: string;
  /** 관련 가족 (기본값: all) */
  person?: string;
}
