/**
 * PDF text extraction for document ingestion.
 */
import fs from 'fs/promises';

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return (data?.text ?? '').trim();
}
