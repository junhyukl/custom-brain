/**
 * Ingest a folder: scan files and POST to custom-brain API.
 * Usage: npx ts-node -r tsconfig-paths/register scripts/ingest-folder.ts <folder>
 * Requires server running at BASE_URL. Env: BRAIN_API_URL (default http://localhost:3001).
 */
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BRAIN_API_URL ?? process.env.CUSTOM_BRAIN_URL ?? 'http://localhost:3001';

async function ingestFile(filePath: string, scope: 'personal' | 'family'): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  const relative = path.relative(process.cwd(), filePath);
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    const buf = fs.readFileSync(filePath);
    const base64 = buf.toString('base64');
    const res = await fetch(`${BASE_URL}/brain/photo/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64, source: relative }),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log('Photo:', relative, (await res.json()).memoryId);
  } else if (['.md', '.txt'].includes(ext)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const res = await fetch(`${BASE_URL}/brain/memory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.slice(0, 50000),
        type: 'document',
        scope,
        metadata: { filePath: relative },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log('Doc:', relative, (await res.json()).id);
  }
}

async function walk(dir: string, scope: 'personal' | 'family'): Promise<void> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.')) await walk(full, scope);
    else if (e.isFile()) {
      try {
        await ingestFile(full, scope);
      } catch (err) {
        console.error('Skip', full, err);
      }
    }
  }
}

const folder = process.argv[2] ?? path.join(process.cwd(), 'brain-data');
const scope = folder.includes('family') ? 'family' : 'personal';
walk(folder, scope).then(() => console.log('Done.'));
