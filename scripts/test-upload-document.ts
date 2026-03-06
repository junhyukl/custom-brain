/**
 * /brain/upload/document 호출 테스트 (TXT + PDF)
 *
 * 사용법: 백엔드 실행 중에
 *   pnpm run test:upload-document
 */
import FormData from 'form-data';
import axios from 'axios';

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

  // 2) PDF: 빈 페이지 PDF → 텍스트 없어서 success: false 가능
  const minimalPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000014 00000 n \n0000000063 00000 n \n0000000112 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n201\n%%EOF',
    'utf8',
  );
  console.log('\n[2] PDF upload (minimal, no text)...');
  const pdfRes = await uploadDocument(minimalPdf, 'sample.pdf', 'application/pdf');
  console.log('Status:', pdfRes.status, 'Response:', JSON.stringify(pdfRes.data, null, 2));
  const pdfAccepted = pdfRes.status === 201;
  if (pdfAccepted) console.log('PDF upload: accepted (201). success may be false if no extractable text.');
  else console.log('PDF upload: unexpected status');

  process.exit(txtOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
