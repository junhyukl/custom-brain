/**
 * OpenClaw-style Agent: 질문 → Memory Core 툴 검색 → Ollama LLM → 답변
 *
 * 전제: custom-brain 서버 실행 중 (pnpm run start:dev), Ollama 실행 중
 *
 * 사용법: pnpm run run-agent
 * 환경변수: BRAIN_API_URL=http://localhost:3001, OLLAMA_URL=http://localhost:11434, LLM_MODEL=mistral:7b-instruct
 */

import {
  searchMemory,
  searchPhotos,
  searchDocuments,
  timeline,
  familyTree,
  type MemoryHit,
  type TimelineEntry,
  type FamilyTreeEntry,
} from '../src/agent-tools/client-tools';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const LLM_MODEL = process.env.LLM_MODEL ?? 'mistral:7b-instruct';

function formatMemories(label: string, items: MemoryHit[]): string {
  if (!items.length) return '';
  const lines = items.map((m) => `- ${(m.content ?? '').slice(0, 300)}${(m.metadata as { filePath?: string })?.filePath ? ` (${(m.metadata as { filePath: string }).filePath})` : ''}`);
  return `[${label}]\n${lines.join('\n')}\n`;
}

function formatTimeline(entries: TimelineEntry[]): string {
  if (!entries.length) return '';
  const lines = entries.slice(0, 15).map((e) => `- ${e.date}: ${e.description.slice(0, 150)}`);
  return '[Timeline]\n' + lines.join('\n') + '\n';
}

function formatFamilyTree(tree: FamilyTreeEntry[]): string {
  if (!tree.length) return '';
  const lines = tree.map((p) => `- ${p.name} (${p.relation})${p.description ? `: ${p.description}` : ''}`);
  return '[Family]\n' + lines.join('\n') + '\n';
}

async function askOllama(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: LLM_MODEL, prompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { response?: string };
  return data.response ?? '';
}

async function answer(question: string): Promise<string> {
  const [memories, photos, docs, timelineEntries, tree] = await Promise.all([
    searchMemory(question, 5),
    searchPhotos(question, 5),
    searchDocuments(question, 5),
    timeline(undefined, 20),
    familyTree(),
  ]);

  const sections = [
    formatMemories('Memories', memories),
    formatMemories('Photos', photos),
    formatMemories('Documents', docs),
    formatTimeline(timelineEntries),
    formatFamilyTree(tree),
  ].filter(Boolean);

  const context = sections.length
    ? '아래는 사용자 메모리/사진/문서/타임라인/가족 정보 요약이다. 이에 기반해 질문에 짧고 친절하게 답하라.\n\n' +
      sections.join('\n') +
      '\n'
    : '관련 메모리가 없습니다. 질문에 일반적으로 짧게 답하라.\n\n';

  const prompt = context + '질문: ' + question + '\n\n답변:';
  return askOllama(prompt);
}

async function main() {
  const questions = [
    '2015년 가족 여행 사진 보여줘',
    '할아버지 사진만 검색해줘',
    'Tesla 프로젝트 문서 찾아줘',
  ];

  console.log('Personal + Family AI Agent (Ollama)\n');

  for (const q of questions) {
    try {
      console.log('Q:', q);
      const a = await answer(q);
      console.log('A:', a.trim());
      console.log('');
    } catch (err) {
      console.error('Error:', err);
    }
  }

  console.log('Done.');
}

main();
