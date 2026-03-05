#!/usr/bin/env node
/**
 * 샘플 이미지 3장 + PDF 2개를 data/images, data/documents 에 다운로드합니다.
 * 사용: node scripts/download-sample-data.js (또는 pnpm run sample:download)
 * Node 18+ (fetch 내장) 필요.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const IMAGES = path.join(DATA, 'images');
const DOCUMENTS = path.join(DATA, 'documents');

const ASSETS = [
  {
    url: 'https://picsum.photos/seed/family-trip-1975/400/300',
    dir: IMAGES,
    file: 'family_trip_1975.jpg',
  },
  {
    url: 'https://picsum.photos/seed/grandma-birthday-1980/400/300',
    dir: IMAGES,
    file: 'grandma_birthday_1980.jpg',
  },
  {
    url: 'https://picsum.photos/seed/parents-wedding-2000/400/300',
    dir: IMAGES,
    file: 'parents_wedding_2000.jpg',
  },
  {
    url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
    dir: DOCUMENTS,
    file: 'family_letter_1970.pdf',
  },
  {
    url: 'https://www.africau.edu/images/default/sample.pdf',
    dir: DOCUMENTS,
    file: 'family_event_1985.pdf',
  },
];

async function download(url, filePath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} => ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

(async () => {
  console.log('Downloading sample assets...');
  let ok = 0;
  for (const { url, dir, file } of ASSETS) {
    const filePath = path.join(dir, file);
    try {
      await download(url, filePath);
      console.log('  OK', file);
      ok++;
    } catch (e) {
      console.warn('  SKIP', file, '(수동 다운로드: README 샘플 데이터 표 참고)');
    }
  }
  console.log('Done.', ok, 'files saved.');
})();
