/**
 * /brain/upload/document 호출 테스트 (TXT + PDF + DOCX)
 *
 * 사용법: 백엔드 실행 중에
 *   pnpm run test:upload-document
 */
import FormData from 'form-data';
import axios from 'axios';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const UPLOAD_URL = process.env.CUSTOM_BRAIN_URL
  ? `${process.env.CUSTOM_BRAIN_URL.replace(/\/$/, '')}/brain/upload/document`
  : 'http://localhost:3001/brain/upload/document';

async function uploadDocument(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<{ status: number; data: unknown }> {
  const form = new FormData();
  form.append('file', buffer, { filename, contentType });
  const res = await axios.post(UPLOAD_URL, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true,
    timeout: 120_000,
  });
  return { status: res.status, data: res.data };
}

async function createPdfWithText(text: string): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([612, 792]);
  page.drawText(text, { x: 100, y: 700, size: 12, font });
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

async function createDocxWithText(text: string): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [new Paragraph({ children: [new TextRun(text)] })],
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

async function main() {
  console.log('Upload URL:', UPLOAD_URL);

  // 1) TXT: 텍스트 있음 → 성공 기대
  const txtBody = Buffer.from('Custom-Brain PDF upload test. 문서 업로드 테스트.', 'utf8');
  console.log('\n[1] TXT upload...');
  const txtRes = await uploadDocument(txtBody, 'sample.txt', 'text/plain');
  console.log('Status:', txtRes.status, 'Response:', JSON.stringify(txtRes.data, null, 2));
  const txtOk =
    txtRes.status === 201 &&
    typeof txtRes.data === 'object' &&
    txtRes.data !== null &&
    (txtRes.data as { success?: boolean }).success === true;
  if (txtOk) console.log('TXT upload: OK');
  else console.log('TXT upload: FAIL');

  // 2) PDF with text → success: true 기대 (Helvetica는 한글 미지원이므로 ASCII만 사용)
  const pdfWithText = await createPdfWithText('Custom-Brain PDF test. This PDF has extractable text.');
  console.log('\n[2] PDF upload (with text)...');
  const pdfTextRes = await uploadDocument(pdfWithText, 'with-text.pdf', 'application/pdf');
  console.log('Status:', pdfTextRes.status, 'Response:', JSON.stringify(pdfTextRes.data, null, 2));
  const pdfTextOk =
    pdfTextRes.status === 201 &&
    typeof pdfTextRes.data === 'object' &&
    pdfTextRes.data !== null &&
    (pdfTextRes.data as { success?: boolean }).success === true &&
    typeof (pdfTextRes.data as { contentLength?: number }).contentLength === 'number' &&
    (pdfTextRes.data as { contentLength: number }).contentLength >= 2;
  if (pdfTextOk) console.log('PDF (with text) upload: OK');
  else console.log('PDF (with text) upload: FAIL');

  // 3) PDF: 빈 페이지 PDF → 텍스트 없어서 success: false 가능
  const minimalPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000014 00000 n \n0000000063 00000 n \n0000000112 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n201\n%%EOF',
    'utf8',
  );
  console.log('\n[3] PDF upload (minimal, no text)...');
  const pdfRes = await uploadDocument(minimalPdf, 'sample.pdf', 'application/pdf');
  console.log('Status:', pdfRes.status, 'Response:', JSON.stringify(pdfRes.data, null, 2));
  const pdfAccepted = pdfRes.status === 201;
  if (pdfAccepted) console.log('PDF (no text) upload: accepted (201). success may be false.');
  else console.log('PDF (no text) upload: unexpected status');

  // 4) DOCX: 텍스트 있음 → 성공 기대 (mammoth로 추출)
  const docxBody = await createDocxWithText('Custom-Brain DOCX upload test. DOCX 문서 업로드 테스트.');
  console.log('\n[4] DOCX upload...');
  const docxRes = await uploadDocument(
    docxBody,
    'sample.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
  console.log('Status:', docxRes.status, 'Response:', JSON.stringify(docxRes.data, null, 2));
  const docxOk =
    docxRes.status === 201 &&
    typeof docxRes.data === 'object' &&
    docxRes.data !== null &&
    (docxRes.data as { success?: boolean }).success === true &&
    typeof (docxRes.data as { contentLength?: number }).contentLength === 'number' &&
    (docxRes.data as { contentLength: number }).contentLength >= 2;
  if (docxOk) console.log('DOCX upload: OK');
  else console.log('DOCX upload: FAIL');

  const allOk = txtOk && pdfTextOk && docxOk;
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
