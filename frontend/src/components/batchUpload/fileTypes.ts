/** 확장자로 업로드 타입 판별 (백엔드 PHOTO_EXT_REGEX, DOCUMENT_EXT_REGEX와 동일) */
const PHOTO_EXT = /\.(jpg|jpeg|png|webp)$/i;
const DOCUMENT_EXT = /\.(pdf|docx|txt|md)$/i;

export type BatchUploadType = 'photo' | 'document';

export function getUploadType(file: File): BatchUploadType | null {
  const name = file.name || '';
  if (PHOTO_EXT.test(name)) return 'photo';
  if (DOCUMENT_EXT.test(name)) return 'document';
  return null;
}

export const PHOTO_EXTENSIONS_DESC = 'JPG, PNG, WebP';
export const DOCUMENT_EXTENSIONS_DESC = 'PDF, DOCX, TXT, MD';
