#!/usr/bin/env node
/**
 * data/images, data/documents 에 최소 시드 파일 생성 (네트워크 없이 실행 가능).
 * - 이미지 3개: 1x1 픽셀 JPEG (실제 사진은 pnpm run sample:download 로 받으세요)
 * - PDF 2개: 한 페이지 텍스트만 있는 최소 PDF
 * 사용: node scripts/create-seed-assets.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES = path.join(ROOT, 'data', 'images');
const DOCUMENTS = path.join(ROOT, 'data', 'documents');

// 1x1 grey pixel JPEG (valid)
const MINIMAL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
);

fs.mkdirSync(IMAGES, { recursive: true });
fs.mkdirSync(DOCUMENTS, { recursive: true });

const images = [
  'family_trip_1975.jpg',
  'grandma_birthday_1980.jpg',
  'parents_wedding_2000.jpg',
];
images.forEach((name) => {
  fs.writeFileSync(path.join(IMAGES, name), MINIMAL_JPEG);
  console.log('  written', path.join('data', 'images', name));
});

const texts = [
  {
    file: 'family_letter_1970.txt',
    content: '1970년 가족 편지\n\n할머니께서 보내신 편지. 건강을 묻고 가족 모임을 제안하셨다.',
  },
  {
    file: 'family_event_1985.txt',
    content: '1985년 가족 행사 기록\n\n할아버지 생신, 가족이 모여 식사를 했다.',
  },
];
texts.forEach(({ file, content }) => {
  fs.writeFileSync(path.join(DOCUMENTS, file), content, 'utf8');
  console.log('  written', path.join('data', 'documents', file));
});

console.log('Seed assets created. Run: curl -X POST http://localhost:3001/brain/family/initialize');
console.log('(Or use "샘플 데이터 로드" in the UI.)');
