/**
 * DOCX text extraction for document ingestion.
 * Buffer 사용으로 Windows 경로(백슬래시) 이슈 방지.
 */
import fs from 'fs/promises';
import mammoth from 'mammoth';

export async function extractTextFromDocx(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? '';
}
