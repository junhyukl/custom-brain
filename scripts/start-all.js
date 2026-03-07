#!/usr/bin/env node
/**
 * start:all — Docker(실패해도 무시) 후 Nest + ai + face + UI 동시 실행.
 * Windows에서 "|| true" 미지원이라 Node 스크립트로 처리.
 */
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');

// 1) Docker up (실패해도 진행: 포트 이미 사용 중 등)
try {
  execSync('pnpm run start:docker', { stdio: 'inherit', cwd: root });
} catch (_) {
  console.warn('[start-all] Docker 실패(예: 27017 포트 사용 중). 앱 서비스만 실행합니다.');
}

// 2) Nest + ai + face + UI
const concurrently = require('concurrently');

const { result } = concurrently(
  [
    { command: 'pnpm run start:dev', name: 'nest' },
    { command: 'node scripts/run-ai-service.js', name: 'ai' },
    { command: 'node scripts/run-face-service.js', name: 'face' },
    { command: 'node scripts/run-ui.js', name: 'ui' },
  ],
  { cwd: root, prefix: 'name' }
);
result.then(
  () => process.exit(0),
  () => process.exit(1)
);
