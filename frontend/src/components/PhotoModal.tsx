import { useEffect, useCallback, useState } from 'react';
import axios from 'axios';
import { toPhotoUrl } from '../utils/photoUrl';
import type { MemoryHit } from './Search';

type PhotoModalProps = {
  photo: MemoryHit | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
};

export default function PhotoModal({ photo, onClose, onDeleted }: PhotoModalProps) {
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!photo) return;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [photo, handleEscape]);

  const handleDelete = useCallback(() => {
    if (!photo?.id || deleteLoading) return;
    if (!confirm('이 사진과 연결된 파일·벡터·메모리를 모두 삭제합니다. 계속할까요?')) return;
    setDeleteLoading(true);
    axios
      .delete<{ deleted: boolean; error?: string }>(`/brain/memory/${photo.id}`)
      .then((res) => {
        if (res.data?.deleted) {
          onDeleted?.(photo.id);
          window.dispatchEvent(new CustomEvent('memory-deleted', { detail: { id: photo.id } }));
          onClose();
        } else {
          alert(res.data?.error ?? '삭제에 실패했습니다.');
        }
      })
      .catch(() => alert('삭제 요청 중 오류가 발생했습니다.'))
      .finally(() => setDeleteLoading(false));
  }, [photo?.id, deleteLoading, onClose, onDeleted]);

  if (!photo || !photo.metadata?.filePath) return null;

  const date = photo.metadata.date ?? (photo.metadata as { exif?: { date?: string } }).exif?.date;
  const location =
    photo.metadata.location ?? (photo.metadata as { exif?: { gps?: string } }).exif?.gps;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="사진 확대"
    >
      <div
        className="relative bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-2xl font-bold transition-colors"
          aria-label="닫기"
        >
          ×
        </button>

        <img
          src={toPhotoUrl(photo.metadata.filePath)}
          alt=""
          className="w-full h-auto max-h-[60vh] object-contain bg-zinc-800"
        />

        <div className="p-4 space-y-3">
          <div>
            <span className="text-zinc-500 text-sm font-medium">설명</span>
            <p className="text-zinc-200 mt-0.5">{photo.content || '없음'}</p>
          </div>

          {(date || location || (photo.metadata.people?.length ?? 0) > 0) && (
            <div className="pt-2 border-t border-zinc-700 space-y-2 text-sm">
              {date && (
                <div>
                  <span className="text-zinc-500 font-medium">촬영일</span>
                  <span className="ml-2 text-zinc-300">{date}</span>
                </div>
              )}
              {location && (
                <div>
                  <span className="text-zinc-500 font-medium">GPS / 위치</span>
                  <span className="ml-2 text-zinc-300">{location}</span>
                </div>
              )}
              {photo.metadata.people?.length ? (
                <div>
                  <span className="text-zinc-500 font-medium">인물</span>
                  <span className="ml-2 text-blue-400">{photo.metadata.people.join(', ')}</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="text-xs text-zinc-500 truncate" title={photo.metadata.filePath}>
            {photo.metadata.filePath.split(/[/\\]/).pop()}
          </div>

          <div className="pt-3 border-t border-zinc-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
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
    </div>
  );
}
