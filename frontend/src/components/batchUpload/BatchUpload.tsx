import { useState, useCallback } from 'react';
import axios from 'axios';
import { getUploadType, PHOTO_EXTENSIONS_DESC, DOCUMENT_EXTENSIONS_DESC } from './fileTypes';
import { toErrorMessage } from '../../utils/request';

type JobStatus = 'pending' | 'uploading' | 'done' | 'error' | 'skipped';

export interface BatchFileItem {
  file: File;
  status: JobStatus;
  type: 'photo' | 'document' | null;
  error?: string;
}

export default function BatchUpload() {
  const [items, setItems] = useState<BatchFileItem[]>([]);
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFile = async (item: BatchFileItem): Promise<void> => {
    const { file, type } = item;
    if (!type) return;
    const endpoint = type === 'photo' ? '/brain/upload/photo' : '/brain/upload/document';
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post<{ success: boolean; memoryId?: string; error?: string; contentLength?: number }>(
      endpoint,
      formData,
      { headers: {} },
    );
    if (!res.data.success) {
      throw new Error(res.data.error ?? '업로드 실패');
    }
  };

  const runBatch = useCallback(async () => {
    const pending = items.filter((i) => i.status === 'pending' && i.type != null);
    if (pending.length === 0) return;
    setRunning(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status !== 'pending' || item.type == null) {
        if (item.status === 'pending' && item.type == null) {
          setItems((prev) =>
            prev.map((p, idx) => (idx === i ? { ...p, status: 'skipped' as JobStatus, error: '지원하지 않는 확장자' } : p)),
          );
        }
        continue;
      }
      setItems((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: 'uploading' as JobStatus } : p)));
      try {
        await processFile(item);
        setItems((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: 'done' as JobStatus } : p)));
      } catch (err: unknown) {
        setItems((prev) =>
          prev.map((p, idx) => (idx === i ? { ...p, status: 'error' as JobStatus, error: toErrorMessage(err) } : p)),
        );
      }
    }
    setRunning(false);
  }, [items]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      const newItems: BatchFileItem[] = files.map((file) => ({
        file,
        status: 'pending',
        type: getUploadType(file),
      }));
      setItems((prev) => prev.concat(newItems));
    },
    [],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const clearList = useCallback(() => {
    setItems([]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const doneCount = items.filter((i) => i.status === 'done').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const skippedCount = items.filter((i) => i.status === 'skipped').length;
  const pendingCount = items.filter((i) => i.status === 'pending').length;

  return (
    <div className="mt-6 pt-6 border-t border-zinc-800">
      <h3 className="text-lg font-semibold mb-2">일괄 업로드 (배치)</h3>
      <p className="text-zinc-400 text-sm mb-3">
        파일을 끌어다 놓으면 확장자에 따라 사진({PHOTO_EXTENSIONS_DESC}) / 문서({DOCUMENT_EXTENSIONS_DESC})로
        분류되어, 한 건씩 학습 후 업로드됩니다.
      </p>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-600 bg-zinc-800/50'
        }`}
      >
        <p className="text-zinc-400">파일을 여기에 드롭하세요</p>
        <p className="text-zinc-500 text-xs mt-1">사진: {PHOTO_EXTENSIONS_DESC} / 문서: {DOCUMENT_EXTENSIONS_DESC}</p>
      </div>

      {items.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 items-center mt-3">
            <button
              type="button"
              onClick={runBatch}
              disabled={running || pendingCount === 0}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {running ? '업로드 중…' : `배치 실행 (${pendingCount}건)`}
            </button>
            <button
              type="button"
              onClick={clearList}
              disabled={running}
              className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-50"
            >
              목록 비우기
            </button>
            <span className="text-zinc-500 text-sm">
              완료 {doneCount} / 실패 {errorCount} / 제외 {skippedCount}
            </span>
          </div>

          <ul className="mt-3 space-y-1 max-h-48 overflow-y-auto">
            {items.map((item, index) => (
              <li
                key={`${item.file.name}-${index}`}
                className="flex items-center gap-2 py-1.5 px-2 rounded bg-zinc-800/80 text-sm"
              >
                <span className="flex-shrink-0 w-6 text-zinc-500">
                  {item.status === 'pending' && '⏳'}
                  {item.status === 'uploading' && '🔄'}
                  {item.status === 'done' && '✅'}
                  {item.status === 'error' && '❌'}
                  {item.status === 'skipped' && '⏭️'}
                </span>
                <span className="min-w-0 truncate flex-1" title={item.file.name}>
                  {item.file.name}
                </span>
                <span className="text-zinc-500 flex-shrink-0">
                  {item.type === 'photo' && '사진'}
                  {item.type === 'document' && '문서'}
                  {item.type == null && '미지원'}
                </span>
                {item.error && <span className="text-red-400 text-xs truncate max-w-[12rem]" title={item.error}>{item.error}</span>}
                {!running && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-zinc-500 hover:text-red-400 flex-shrink-0"
                    aria-label="제거"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
