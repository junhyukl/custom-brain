#!/usr/bin/env node
/**
 * Upload folder batch job — UI 일괄 업로드와 동일한 API로 처리.
 *
 * 1. brain-data/upload (또는 UPLOAD_FOLDER)에 파일을 복사해 넣음.
 * 2. pnpm run batch-upload 실행 (서버 실행 중이어야 함).
 * 3. 확장자별로 사진 → /brain/upload/photo, 문서 → /brain/upload/document 로 전송.
 * 4. 성공한 파일은 upload/processed/ 로 이동 (재처리 방지).
 *
 * 환경 변수:
 *   UPLOAD_FOLDER   — 업로드 폴더 경로 (기본: brain-data/upload)
 *   BRAIN_DATA_PATH — brain-data 루트 (UPLOAD_FOLDER 미설정 시 여기/upload 사용)
 *   BRAIN_API_URL  — API 베이스 (기본: http://localhost:3001)
 */
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const cwd = process.cwd();
const BRAIN_DATA = process.env.BRAIN_DATA_PATH || path.join(cwd, 'brain-data');
const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || path.join(BRAIN_DATA, 'upload');
const PROCESSED_SUBDIR = 'processed';
const BASE_URL = (process.env.BRAIN_API_URL || 'http://localhost:3001').replace(/\/$/, '');

/** Must match backend PHOTO_EXT_REGEX / DOCUMENT_EXT_REGEX (src/common/constants.ts) */
const PHOTO_EXT = /\.(jpg|jpeg|png|webp)$/i;
const DOCUMENT_EXT = /\.(pdf|docx|txt|md)$/i;

function getUploadType(filename) {
  if (PHOTO_EXT.test(filename)) return 'photo';
  if (DOCUMENT_EXT.test(filename)) return 'document';
  return null;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function moveToProcessed(filePath) {
  const dir = path.join(UPLOAD_FOLDER, PROCESSED_SUBDIR);
  ensureDir(dir);
  const base = path.basename(filePath);
  const ext = path.extname(base);
  const name = path.basename(base, ext);
  let dest = path.join(dir, base);
  let n = 0;
  while (fs.existsSync(dest)) {
    n += 1;
    dest = path.join(dir, `${name}_${n}${ext}`);
  }
  fs.renameSync(filePath, dest);
  return dest;
}

async function uploadFile(filePath, type) {
  const endpoint = type === 'photo' ? `${BASE_URL}/brain/upload/photo` : `${BASE_URL}/brain/upload/document`;
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), { filename: path.basename(filePath) });

  const res = await axios.post(endpoint, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    validateStatus: (s) => s >= 200 && s < 500,
  });

  if (res.status !== 201) {
    const msg = res.data?.error || res.statusText || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  if (res.data && typeof res.data.success === 'boolean' && !res.data.success) {
    throw new Error(res.data.error || '업로드 실패');
  }
  return res.data;
}

async function main() {
  ensureDir(UPLOAD_FOLDER);
  ensureDir(path.join(UPLOAD_FOLDER, PROCESSED_SUBDIR));

  if (!fs.existsSync(UPLOAD_FOLDER)) {
    console.error('[batch-upload] 업로드 폴더가 없습니다:', UPLOAD_FOLDER);
    process.exit(1);
  }

  const entries = fs.readdirSync(UPLOAD_FOLDER, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile())
    .map((e) => path.join(UPLOAD_FOLDER, e.name))
    .filter((p) => {
      const type = getUploadType(path.basename(p));
      return type !== null;
    });

  if (files.length === 0) {
    console.log('[batch-upload] 처리할 파일이 없습니다. (사진: jpg/png/webp, 문서: pdf/docx/txt/md)');
    console.log('[batch-upload] 폴더:', UPLOAD_FOLDER);
    process.exit(0);
  }

  console.log('[batch-upload] 파일 %d건 처리 시작 (API: %s)', files.length, BASE_URL);

  let done = 0;
  let failed = 0;

  for (const filePath of files) {
    const name = path.basename(filePath);
    const type = getUploadType(name);
    try {
      await uploadFile(filePath, type);
      moveToProcessed(filePath);
      done += 1;
      console.log('  [OK] %s (%s)', name, type);
    } catch (err) {
      failed += 1;
      console.error('  [FAIL] %s — %s', name, err.message || err);
    }
  }

  console.log('[batch-upload] 완료: 성공 %d, 실패 %d', done, failed);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[batch-upload]', err);
  process.exit(1);
});
