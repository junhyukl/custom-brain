/**
 * Agent tools as HTTP client — OpenClaw / run-agent에서 custom-brain API 호출용.
 * 서버가 실행 중이어야 함 (pnpm run start:dev).
 */

const BASE_URL = process.env.BRAIN_API_URL ?? 'http://localhost:3001';

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Brain API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export interface MemoryHit {
  id: string;
  content: string;
  type?: string;
  metadata?: { filePath?: string; people?: string[]; date?: string };
}

export async function searchMemory(query: string, limit = 5): Promise<MemoryHit[]> {
  const { results } = await get<{ results: MemoryHit[] }>('/brain/memory/search', {
    q: query,
    limit,
  });
  return results ?? [];
}

export async function searchPhotos(query: string, limit = 5): Promise<MemoryHit[]> {
  const { results } = await get<{ results: MemoryHit[] }>('/brain/photos/search', {
    q: query,
    limit,
  });
  return results ?? [];
}

export async function searchDocuments(query: string, limit = 5): Promise<MemoryHit[]> {
  const { results } = await get<{ results: MemoryHit[] }>('/brain/documents/search', {
    q: query,
    limit,
  });
  return results ?? [];
}

export interface TimelineEntry {
  date: string;
  description: string;
  memoryId: string;
  type: string;
  scope: string;
}

export async function timeline(scope?: string, limit = 50): Promise<TimelineEntry[]> {
  const params: Record<string, string | number> = { limit };
  if (scope) params.scope = scope;
  const { timeline: list } = await get<{ timeline: TimelineEntry[] }>('/brain/timeline', params);
  return list ?? [];
}

export interface FamilyTreeEntry {
  id: string;
  name: string;
  relation: string;
  birthDate?: string;
  description?: string;
  children: FamilyTreeEntry[];
}

export async function familyTree(): Promise<FamilyTreeEntry[]> {
  const { tree } = await get<{ tree: FamilyTreeEntry[] }>('/brain/family/tree');
  return tree ?? [];
}
