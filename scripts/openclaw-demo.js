#!/usr/bin/env node
/**
 * 대화형 OpenClaw 테스트 시나리오.
 * 서버가 떠 있는 상태에서 실행: node scripts/openclaw-demo.js
 * BRAIN_URL=http://localhost:3001 (기본)
 */

const BASE = process.env.BRAIN_URL || 'http://localhost:3001';

const SCENARIO = [
  { step: 1, question: '할아버지 이야기 알려줘', expect: '할아버지' },
  { step: 2, question: '할머니 여행 사진 보여줘', expect: '여행' },
  { step: 3, question: '엄마 아빠 출생 이야기 알려줘', expect: '부산' },
  { step: 4, question: '1975년 가족 여행 이야기', expect: '설악산' },
];

async function ask(question) {
  const res = await fetch(`${BASE}/brain/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.answer || '';
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('=== Family Brain OpenClaw 대화형 테스트 ===\n');
  console.log('서버:', BASE);
  console.log('샘플 데이터가 로드되어 있어야 합니다. (UI에서 "샘플 데이터 로드" 또는 curl -X POST .../brain/family/initialize)\n');

  for (const { step, question, expect } of SCENARIO) {
    console.log(`--- Step ${step} ---`);
    console.log('질문:', question);
    try {
      const answer = await ask(question);
      console.log('답변:', answer.slice(0, 200) + (answer.length > 200 ? '...' : ''));
      const ok = answer.includes(expect) ? '✓' : '?';
      console.log(`기대 키워드 "${expect}" ${ok}\n`);
    } catch (e) {
      console.error('오류:', e.message, '\n');
    }
    await wait(500);
  }

  console.log('=== 시나리오 종료 ===');
  console.log('브라우저에서 http://localhost:3001/ 로 같은 질문을 해보세요.');
}

main();
