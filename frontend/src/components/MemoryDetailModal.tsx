import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toBrainDataFileUrl } from '../utils/brainDataUrl';
import OriginalFileLink from './OriginalFileLink';
import { getFileName } from '../utils/filePath';
import { useDeleteMemory } from '../hooks/useDeleteMemory';
import { toErrorMessage } from '../utils/request';
import type { MemoryDetail, UpdateMemoryBody } from '../types/api';

export type MemoryDetailModalProps = {
  /** When set, modal opens and fetches GET /brain/memory/:id */
  memoryId: string | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onSaved?: (id: string) => void;
};

export default function MemoryDetailModal({
  memoryId,
  onClose,
  onDeleted,
  onSaved,
}: MemoryDetailModalProps) {
  const [detail, setDetail] = useState<MemoryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPeople, setEditPeople] = useState('');
  const { deleteMemory, loading: deleteLoading } = useDeleteMemory();

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    setSaveError(null);
    try {
      const res = await axios.get<MemoryDetail | null>(`/brain/memory/${id}`);
      const d = res.data ?? null;
      setDetail(d);
      if (d) {
        setEditContent(d.content ?? '');
        setEditDate(d.metadata?.date ?? '');
        setEditPeople(Array.isArray(d.metadata?.people) ? d.metadata.people.join(', ') : '');
      }
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!memoryId) {
      setDetail(null);
      setSaveError(null);
      return;
    }
    loadDetail(memoryId);
  }, [memoryId, loadDetail]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!memoryId) return;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [memoryId, handleEscape]);

  const handleSave = useCallback(async () => {
    if (!detail?.id) return;
    setSaving(true);
    setSaveError(null);
    const body: UpdateMemoryBody = {
      content: editContent,
      metadata: {
        date: editDate.trim() || undefined,
        people: editPeople
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };
    try {
      const res = await axios.patch<MemoryDetail | null>(`/brain/memory/${detail.id}`, body);
      if (res.data) {
        setDetail(res.data);
        setEditContent(res.data.content ?? '');
        setEditDate(res.data.metadata?.date ?? '');
        setEditPeople(Array.isArray(res.data.metadata?.people) ? res.data.metadata.people.join(', ') : '');
        onSaved?.(detail.id);
      }
    } catch (err: unknown) {
      setSaveError(toErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [detail?.id, editContent, editDate, editPeople, onSaved]);

  const handleDelete = useCallback(() => {
    if (!detail?.id) return;
    const id = detail.id;
    deleteMemory(id, {
      confirmMessage: '이 메모리와 연결된 파일·벡터 데이터를 모두 삭제합니다. 계속할까요?',
      onSuccess: () => {
        onDeleted?.(id);
        window.dispatchEvent(new CustomEvent('memory-deleted', { detail: { id } }));
        onClose();
      },
    });
  }, [detail?.id, deleteMemory, onClose, onDeleted]);

  if (!memoryId) return null;

  const displayDate =
    detail?.metadata?.date ?? (typeof detail?.createdAt === 'string' ? detail.createdAt.slice(0, 10) : '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="메모리 상세"
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-lg w-full max-h-[85vh] shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-zinc-700 shrink-0">
          <h3 className="text-lg font-bold">상세 · 편집</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto min-h-0 flex-1">
          {loading && <p className="text-zinc-500 text-sm py-4">불러오는 중…</p>}

          {!loading && !detail && (
            <p className="text-zinc-500 text-sm">메모리를 불러올 수 없습니다.</p>
          )}

          {!loading && detail && (
            <>
              <div className="text-xs font-medium text-zinc-500 mb-3">
                {displayDate} · {detail.type} · {detail.scope}
              </div>

              {detail.type === 'photo' && detail.metadata?.filePath && (
                <div className="mt-2 rounded-lg overflow-hidden bg-zinc-800 mb-3">
                  <img
                    src={toBrainDataFileUrl(detail.metadata.filePath)}
                    alt={detail.content?.slice(0, 80) ?? '사진'}
                    className="w-full max-h-64 object-contain"
                  />
                </div>
              )}

              {detail.metadata?.filePath && (detail.type === 'document' || detail.type === 'photo') && (
                <p className="mb-2">
                  <OriginalFileLink filePath={detail.metadata.filePath} />
                  <span className="ml-2 text-zinc-500 text-xs truncate" title={detail.metadata.filePath}>
                    {getFileName(detail.metadata.filePath)}
                  </span>
                </p>
              )}

              <div className="space-y-3">
                <label className="block text-zinc-400 text-sm font-medium">설명 (내용)</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[120px] px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="내용을 입력하세요"
                />
                <label className="block text-zinc-400 text-sm font-medium">날짜</label>
                <input
                  type="text"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="block text-zinc-400 text-sm font-medium">인물 (쉼표 구분)</label>
                <input
                  type="text"
                  value={editPeople}
                  onChange={(e) => setEditPeople(e.target.value)}
                  placeholder="이름1, 이름2"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {saveError && (
                <p className="mt-3 text-red-400 text-sm">{saveError}</p>
              )}
            </>
          )}
        </div>

        {!loading && detail && (
          <div className="p-4 border-t border-zinc-700 flex justify-end gap-2 shrink-0 bg-zinc-900 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? '저장 중…' : '저장'}
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
        )}
      </div>
    </div>
  );
}
