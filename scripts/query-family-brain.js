#!/usr/bin/env node
/**
 * OpenClaw Agent 스타일 테스트: Brain 서버에 자연어 질문을 보내 답변을 받습니다.
 * 사용: node scripts/query-family-brain.js "할머니 여행 사진 보여줘"
 * 기본 URL: http://localhost:3001 (PORT 환경 변수로 변경 가능)
 */

const BASE_URL = process.env.BRAIN_URL || 'http://localhost:3001';
const question = process.argv[2] || '할아버지 이야기 알려줘';

async function queryFamilyBrain(q) {
  const res = await fetch(`${BASE_URL}/brain/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: q }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

queryFamilyBrain(question)
  .then((data) => {
    console.log('Question:', question);
    console.log('Answer:', data.answer || '(no answer)');
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
