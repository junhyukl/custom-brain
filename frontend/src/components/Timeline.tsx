import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_TIMELINE_LIMIT } from '../constants';
import { useDeleteMemory } from '../hooks/useDeleteMemory';

export interface TimelineEntry {
  date: string;
  description: string;
  memoryId: string;
  type: string;
  scope: string;
}

interface MemoryDetail {
  id: string;
  content: string;
  type: string;
  scope: string;
  metadata: { date?: string; filePath?: string; people?: string[] };
  createdAt: string;
}

function groupByYear(events: TimelineEntry[]): Map<string, TimelineEntry[]> {
  const byYear = new Map<string, TimelineEntry[]>();
  for (const e of events) {
    const year = e.date.slice(0, 4) || '기타';
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(e);
  }
  for (const arr of byYear.values()) {
    arr.sort((a, b) => a.date.localeCompare(b.date));
  }
  return byYear;
}

async function fetchTimeline(): Promise<TimelineEntry[]> {
  const res = await axios.get<{ timeline: TimelineEntry[]; error?: string }>('/brain/timeline', {
    params: { limit: API_TIMELINE_LIMIT },
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.timeline ?? [];
}

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemoryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const { deleteMemory, loading: deleteLoading } = useDeleteMemory();

  const loadTimeline = useCallback(() => {
    setLoading(true);
    fetchTimeline()
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : '타임라인 로드 실패'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  useEffect(() => {
    const onMemoryDeleted = () => loadTimeline();
    window.addEventListener('memory-deleted', onMemoryDeleted);
    return () => window.removeEventListener('memory-deleted', onMemoryDeleted);
  }, [loadTimeline]);

  useEffect(() => {
    if (!selectedMemoryId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    axios
      .get<MemoryDetail | null>(`/brain/memory/${selectedMemoryId}`)
      .then((res) => setDetail(res.data ?? null))
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedMemoryId]);

  const handleDelete = useCallback(() => {
    const id = detail?.id ?? selectedMemoryId;
    if (!id) return;
    deleteMemory(id, {
      onSuccess: () => {
        setSelectedMemoryId(null);
        setDetail(null);
        loadTimeline();
      },
    });
  }, [detail?.id, selectedMemoryId, deleteMemory, loadTimeline]);

  const byYear = groupByYear(events);
  const years = Array.from(byYear.keys()).sort((a, b) =>
    a === '기타' ? 1 : b === '기타' ? -1 : b.localeCompare(a),
  );

  return (
    <section className="p-4 border-b border-zinc-800">
      <h2 className="text-xl font-bold mb-2">Timeline</h2>
      <p className="text-zinc-400 text-sm mb-4">연도별 이벤트·사진·메모 (클릭 시 상세·삭제)</p>

      {loading && <p className="text-zinc-500 text-sm py-4">타임라인 불러오는 중…</p>}
      {error && <p className="text-red-400 text-sm py-2">{error}</p>}
      {!loading && !error && years.length === 0 && (
        <p className="text-zinc-500 text-sm py-4">타임라인 이벤트가 없습니다.</p>
      )}

      {!loading && !error && years.length > 0 && (
        <div className="overflow-x-auto">
          <div className="space-y-6 max-w-3xl min-w-0">
          {years.map((year) => (
            <div key={year} className="border-l-2 border-blue-600 pl-4">
              <h3 className="text-sm font-bold text-blue-500 mb-2">{year}</h3>
              <div className="space-y-2">
                {(byYear.get(year) ?? []).map((e, i) => (
                  <button
                    type="button"
                    key={e.memoryId || i}
                    onClick={() => setSelectedMemoryId(e.memoryId)}
                    className="w-full text-left border border-zinc-700 rounded-lg p-3 bg-zinc-900 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="text-xs font-medium text-zinc-500">{e.date}</div>
                    <div className="text-sm text-zinc-300 mt-0.5">{e.description}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {e.type} · {e.scope}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {selectedMemoryId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedMemoryId(null)}>
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full max-h-[85vh] shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-zinc-700 shrink-0">
              <h3 className="text-lg font-bold">상세</h3>
              <button
                type="button"
                onClick={() => setSelectedMemoryId(null)}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto min-h-0 flex-1">
              {detailLoading && <p className="text-zinc-500 text-sm py-4">불러오는 중…</p>}
              {!detailLoading && detail && (
                <>
                  <div className="text-xs font-medium text-zinc-500">
                    {detail.metadata?.date ?? (typeof detail.createdAt === 'string' ? detail.createdAt.slice(0, 10) : '')} · {detail.type} · {detail.scope}
                  </div>
                  <p className="text-zinc-300 text-sm mt-2 whitespace-pre-wrap">{detail.content}</p>
                </>
              )}
              {!detailLoading && !detail && (
                <p className="text-zinc-500 text-sm">메모리를 불러올 수 없습니다. 아래에서 삭제는 가능합니다.</p>
              )}
            </div>
            <div className="p-4 border-t border-zinc-700 flex justify-end gap-2 shrink-0 bg-zinc-900 rounded-b-xl">
              <button
                type="button"
                onClick={() => setSelectedMemoryId(null)}
                className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleteLoading ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
