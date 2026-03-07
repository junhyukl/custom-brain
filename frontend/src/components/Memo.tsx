import { useState } from 'react';
import axios from 'axios';
import { toErrorMessage } from '../utils/request';

type Scope = 'personal' | 'family';

export default function Memo() {
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<Scope>('personal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setLastSaved(null);
    try {
      await axios.post<{ id: string }>('/brain/memory', {
        content: trimmed,
        scope,
        type: 'note',
      });
      setLastSaved(trimmed.slice(0, 80) + (trimmed.length > 80 ? '…' : ''));
      setContent('');
    } catch (err: unknown) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-4 border-b border-zinc-800">
      <h2 className="text-xl font-bold mb-2">메모</h2>
      <p className="text-zinc-400 text-sm mb-3">
        브레인에 메모를 쓰면 메모리로 저장됩니다. <strong className="text-zinc-300">질문 탭</strong>에서 이 메모를 검색해 답변에 반영합니다.
      </p>

      <div className="mb-3">
        <label className="block text-zinc-400 text-sm font-medium mb-1">범위</label>
        <div className="flex gap-2">
          {(['personal', 'family'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                scope === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {s === 'personal' ? '개인' : '가족'}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="메모 내용을 입력하세요..."
        rows={5}
        className="w-full border border-zinc-600 rounded-lg px-3 py-2 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[120px]"
        disabled={loading}
      />

      <div className="flex flex-wrap gap-2 items-center mt-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !content.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500"
        >
          {loading ? '저장 중…' : '메모 저장'}
        </button>
        {lastSaved && (
          <span className="text-green-400 text-sm" role="status">
            저장됨: {lastSaved}
          </span>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm mt-3" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
