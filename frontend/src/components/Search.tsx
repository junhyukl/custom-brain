import { useState } from 'react';
import axios from 'axios';
import { toPhotoUrl } from '../utils/photoUrl';
import PhotoModal from './PhotoModal';

export interface MemoryHit {
  id: string;
  content: string;
  type?: string;
  metadata?: {
    filePath?: string;
    people?: string[];
    date?: string;
    location?: string;
  };
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemoryHit[]>([]);
  const [mode, setMode] = useState<'photos' | 'documents' | 'memory'>('photos');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<MemoryHit | null>(null);

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
      const res = await axios.get<{ results: MemoryHit[]; error?: string }>(path, {
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
    <section className="p-4 border-b border-zinc-800">
      <h2 className="text-xl font-bold mb-2">검색</h2>
      <p className="text-zinc-400 text-sm mb-3">사진, 문서, 메모 검색 (Qdrant + Memory Core)</p>

      <div className="flex flex-wrap gap-2 items-center mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="사진, 문서, 메모 검색..."
          className="flex-1 min-w-[200px] border border-zinc-600 rounded-lg px-3 py-2 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-1">
          {(['photos', 'documents', 'memory'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {m === 'photos' ? '사진' : m === 'documents' ? '문서' : '메모리'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-medium px-4 py-2 rounded-lg"
        >
          {loading ? '검색 중…' : '검색'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        {results.map((r, i) => (
          <div
            key={r.id || i}
            className={`border border-zinc-700 rounded-lg overflow-hidden bg-zinc-900 flex flex-col ${
              r.type === 'photo' ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-shadow' : ''
            }`}
            onClick={() => r.type === 'photo' && r.metadata?.filePath && setSelectedPhoto(r)}
            onKeyDown={(e) =>
              r.type === 'photo' && r.metadata?.filePath && (e.key === 'Enter' || e.key === ' ') && setSelectedPhoto(r)
            }
            role={r.type === 'photo' ? 'button' : undefined}
            tabIndex={r.type === 'photo' ? 0 : undefined}
          >
            {r.type === 'photo' && r.metadata?.filePath && (
              <img
                src={toPhotoUrl(r.metadata.filePath)}
                alt=""
                className="w-full h-48 object-cover bg-zinc-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            {r.type === 'document' && r.metadata?.filePath && (
              <div className="px-3 py-2 bg-zinc-800 text-zinc-400 text-sm truncate">
                {r.metadata.filePath.split(/[/\\]/).pop()}
              </div>
            )}
            <div className="p-3 flex-1 text-sm text-zinc-300 line-clamp-3">
              {r.content?.slice(0, 200)}
              {r.content && r.content.length > 200 ? '…' : ''}
            </div>
            {r.metadata?.people?.length ? (
              <div className="px-3 pb-2 text-xs text-blue-400">{r.metadata.people.join(', ')}</div>
            ) : null}
            {r.metadata?.date && (
              <div className="px-3 pb-2 text-xs text-zinc-500">{r.metadata.date}</div>
            )}
          </div>
        ))}
      </div>

      {!loading && results.length === 0 && query && !error && (
        <p className="text-zinc-500 text-sm mt-4 text-center py-4">
          검색 결과가 없습니다. pnpm run ingest-all 로 데이터를 수집하세요.
        </p>
      )}

      <PhotoModal
        photo={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        onDeleted={(id) => {
          setSelectedPhoto(null);
          setResults((prev) => prev.filter((r) => r.id !== id));
        }}
      />
    </section>
  );
}
