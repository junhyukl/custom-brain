#!/usr/bin/env node
/**
 * start:all — Docker(실패해도 무시) 후 Ollama 확인·필요 모델 pull, Nest + ai + face + UI 동시 실행.
 * Windows에서 "|| true" 미지원이라 Node 스크립트로 처리.
 */
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const concurrently = require('concurrently');
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const REQUIRED_MODELS = [
  process.env.LLM_MODEL || 'mistral:7b-instruct',
  process.env.EMBED_MODEL || 'nomic-embed-text',
  process.env.VISION_MODEL || 'llava',
].filter((m, i, a) => a.indexOf(m) === i);

async function checkOllamaAndPullModels() {
  let ok = false;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    ok = res.ok;
  } catch (_) {
    console.warn('[start-all] Ollama 확인 실패(응답 없음). ollama serve 실행 후 필요 시 ollama pull <모델> 하세요.');
    return;
  }
  if (!ok) {
    console.warn('[start-all] Ollama 응답 오류. 필요 모델: ' + REQUIRED_MODELS.join(', '));
    return;
  }
  let tags;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    tags = await res.json();
  } catch (e) {
    console.warn('[start-all] Ollama tags 조회 실패:', e.message);
    return;
  }
  const have = new Set((tags.models || []).map((m) => m.name));
  for (const model of REQUIRED_MODELS) {
    const hasModel = Array.from(have).some((n) => n === model || n.startsWith(model + ':'));
    if (!hasModel) {
      console.log('[start-all] Ollama 모델 없음, pull:', model);
      try {
        execSync(`ollama pull ${model}`, { stdio: 'inherit', cwd: root });
      } catch (e) {
        console.warn('[start-all] ollama pull', model, '실패:', e.message);
      }
    }
  }
}

// 1) Docker up (실패해도 진행: 포트 이미 사용 중 등)
try {
  execSync('pnpm run start:docker', { stdio: 'inherit', cwd: root });
} catch (_) {
  console.warn('[start-all] Docker 실패(예: 27017 포트 사용 중). 앱 서비스만 실행합니다.');
}

// 2) Ollama 확인 후 없으면 필요한 모델 전부 pull
checkOllamaAndPullModels()
  .then(() => {
    // 3) Nest + ai + face + UI
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
  })
  .catch((e) => {
    console.error('[start-all] Ollama 확인 중 오류:', e);
    process.exit(1);
  });
