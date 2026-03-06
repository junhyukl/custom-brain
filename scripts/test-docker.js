#!/usr/bin/env node
/**
 * 필요한 Docker 서비스(Qdrant, MongoDB, Ollama) 연결 테스트.
 * 사용: node scripts/test-docker.js
 */

const QDRANT_URL = process.env.QDRANT_URL ?? 'http://localhost:6333';
const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://localhost:27017';
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ${name}: OK`);
    return true;
  } catch (err) {
    console.log(`  ${name}: FAIL - ${err.message || err}`);
    return false;
  }
}

async function main() {
  console.log('Docker / 서비스 연결 테스트\n');

  let ok = 0;

  await check('Qdrant (6333)', async () => {
    const res = await fetch(`${QDRANT_URL}/collections`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }).then((v) => v && ok++);

  await check('MongoDB (27017)', async () => {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 3000 });
    await client.connect();
    await client.db().admin().ping();
    await client.close();
  }).then((v) => v && ok++);

  await check('Ollama (11434)', async () => {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }).then((v) => v && ok++);

  console.log(`\n결과: ${ok}/3 서비스 연결됨`);
  if (ok < 2) {
    console.log('  Qdrant와 MongoDB는 custom-brain 필수. 실행: docker compose up -d');
    process.exit(1);
  }
  process.exit(0);
}

main();
