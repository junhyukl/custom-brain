#!/usr/bin/env node
/**
 * frontend(UI) 개발 서버 띄우기.
 * node로 vite를 직접 실행 (Windows에서 pnpm PATH 이슈 방지).
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const frontendDir = path.join(root, 'frontend');
const viteBin = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(viteBin)) {
  console.error('[ui] frontend/node_modules 없음. 루트에서 pnpm install 후 pnpm -C frontend install 실행하세요.');
  process.exit(1);
}

const child = spawn(process.execPath, [viteBin], {
  cwd: frontendDir,
  stdio: 'inherit',
  env: { ...process.env, FORCE_COLOR: '1' },
  shell: false,
});
child.on('exit', (code) => process.exit(code ?? 0));
