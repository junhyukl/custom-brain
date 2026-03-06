/**
 * Sample image로 /brain/upload/photo 호출 테스트
 *
 * 사용법: 백엔드 실행 중에
 *   pnpm exec ts-node -r tsconfig-paths/register scripts/test-upload-photo.ts
 */
import sharp from 'sharp';
import FormData from 'form-data';
import axios from 'axios';

const UPLOAD_URL = 'http://localhost:3001/brain/upload/photo';

async function main() {
  // 작은 샘플 JPEG 생성 (200x200)
  const buffer = await sharp({
    create: {
      width: 200,
      height: 200,
      channels: 3,
      background: { r: 180, g: 200, b: 220 },
    },
  })
    .jpeg({ quality: 80 })
    .toBuffer();

  console.log('Sample image size:', buffer.length, 'bytes');

  const form = new FormData();
  form.append('file', buffer, { filename: 'sample.jpg', contentType: 'image/jpeg' });

  const res = await axios.post(UPLOAD_URL, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: () => true,
    timeout: 120_000,
  });

  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.data, null, 2));
  if (res.status === 400) {
    console.error('400 Bad Request – 파일이 서버에 전달되지 않았을 수 있습니다. (multipart boundary 확인)');
  }
  process.exit(res.data?.success ? 0 : 1);
}

main().catch((err) => {
  if (axios.isAxiosError(err)) {
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
    console.error('Message:', err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});
