import { useEffect, useCallback } from 'react';
import { useDeleteMemory } from '../hooks/useDeleteMemory';
import type { MemoryHit } from './Search';

type DocumentModalProps = {
  doc: MemoryHit | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
};

export default function DocumentModal({ doc, onClose, onDeleted }: DocumentModalProps) {
  const { deleteMemory, loading: deleteLoading } = useDeleteMemory();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!doc) return;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [doc, handleEscape]);

  const handleDelete = useCallback(() => {
    if (!doc?.id) return;
    const id = doc.id;
    deleteMemory(id, {
      confirmMessage: '이 문서와 연결된 파일·벡터·메모리를 모두 삭제합니다. 계속할까요?',
      onSuccess: () => {
        onDeleted?.(id);
        window.dispatchEvent(new CustomEvent('memory-deleted', { detail: { id } }));
        onClose();
      },
    });
  }, [doc?.id, deleteMemory, onClose, onDeleted]);

  if (!doc) return null;

  const fileName = doc.metadata?.filePath?.split(/[/\\]/).pop() ?? '문서';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="문서 상세"
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between shrink-0">
          <h3 className="font-semibold text-zinc-100 truncate pr-2" title={fileName}>
            {fileName}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600/80 hover:bg-red-600 text-white disabled:opacity-50"
            >
              {deleteLoading ? '삭제 중…' : '삭제'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
            >
              닫기
            </button>
          </div>
        </div>
        <div className="p-4 overflow-auto flex-1 min-h-0">
          {doc.metadata?.date && (
            <p className="text-xs text-zinc-500 mb-2">날짜: {doc.metadata.date}</p>
          )}
          <pre className="text-sm text-zinc-300 whitespace-pre-wrap break-words font-sans">
            {doc.content ?? '(내용 없음)'}
          </pre>
        </div>
      </div>
    </div>
  );
}
