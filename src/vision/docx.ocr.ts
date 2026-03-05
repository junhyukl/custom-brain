/**
 * DOCX text extraction for document ingestion.
 */
import mammoth from 'mammoth';

export async function extractTextFromDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value?.trim() ?? '';
}
