import { useState } from 'react';
import axios from 'axios';
import './App.css';

const API = ''; // proxy: /api, /brain-data → localhost:3001

interface MemoryHit {
  id: string;
  content: string;
  type?: string;
  metadata?: {
    filePath?: string;
    people?: string[];
    date?: string;
  };
}

function toPhotoUrl(filePath: string | undefined): string {
  if (!filePath) return '';
  const idx = filePath.indexOf('brain-data');
  const relative =
    idx >= 0
      ? filePath.slice(idx + 'brain-data'.length).replace(/^[/\\]+/, '')
      : filePath.replace(/^[/\\]+/, '');
  return `/brain-data/${relative}`;
}

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemoryHit[]>([]);
  const [mode, setMode] = useState<'photos' | 'documents' | 'memory'>('photos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const path =
        mode === 'photos'
          ? '/brain/photos/search'
          : mode === 'documents'
            ? '/brain/documents/search'
            : '/brain/memory/search';
      const res = await axios.get<{ results: MemoryHit[]; error?: string }>(`${API}${path}`, {
        params: { q: query.trim(), limit: 12 },
      });
      setResults(res.data.results ?? []);
      setError(res.data.error ?? null);
    } catch (err: unknown) {
      setResults([]);
      setError(err instanceof Error ? err.message : '검색 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Personal + Family AI Search</h1>
        <p className="sub">사진·문서·메모 검색 (Qdrant + OpenClaw)</p>
      </header>

      <div className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="예: 2015년 가족 여행 사진, Tesla 문서..."
          className="input"
        />
        <div className="tabs">
          {(['photos', 'documents', 'memory'] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? 'tab active' : 'tab'}
              onClick={() => setMode(m)}
            >
              {m === 'photos' ? '사진' : m === 'documents' ? '문서' : '메모리'}
            </button>
          ))}
        </div>
        <button type="button" onClick={handleSearch} className="btn" disabled={loading}>
          {loading ? '검색 중…' : '검색'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="results grid-cols-3">
        {results.map((r, i) => (
          <div key={r.id || i} className="card">
            {r.type === 'photo' && r.metadata?.filePath && (
              <img
                src={toPhotoUrl(r.metadata.filePath)}
                alt=""
                className="thumb"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            {r.type === 'document' && (
              <div className="doc-meta">
                {r.metadata?.filePath && (
                  <span className="file-path">{r.metadata.filePath.split(/[/\\]/).pop()}</span>
                )}
              </div>
            )}
            <div className="content">{r.content?.slice(0, 200)}{r.content && r.content.length > 200 ? '…' : ''}</div>
            {r.metadata?.people?.length ? (
              <div className="people">{r.metadata.people.join(', ')}</div>
            ) : null}
            {r.metadata?.date && <div className="date">{r.metadata.date}</div>}
          </div>
        ))}
      </div>

      {!loading && results.length === 0 && query && !error && (
        <p className="empty">검색 결과가 없습니다. ingestion을 먼저 실행하세요 (pnpm run ingest-all).</p>
      )}
    </div>
  );
}

export default App;
