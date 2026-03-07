import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { API_TIMELINE_LIMIT } from '../constants';
import MemoryDetailModal from './MemoryDetailModal';
import type { TimelineEntry } from '../types/api';

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

      <MemoryDetailModal
        memoryId={selectedMemoryId}
        onClose={() => setSelectedMemoryId(null)}
        onDeleted={() => {
          setSelectedMemoryId(null);
          loadTimeline();
        }}
        onSaved={() => loadTimeline()}
      />
    </section>
  );
}
