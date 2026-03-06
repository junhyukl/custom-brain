import { useState, useRef } from 'react';
import axios from 'axios';
import { PHOTO_ACCEPT, DOCUMENT_ACCEPT } from '../constants';

type UploadType = 'photo' | 'document';

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File, uploadType: UploadType) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const endpoint = uploadType === 'photo' ? '/brain/upload/photo' : '/brain/upload/document';
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post<{ success: boolean; memoryId?: string; error?: string; filePath?: string; contentLength?: number }>(
        endpoint,
        formData,
        { headers: {} },
      );
      if (res.data.success) {
        setMessage({
          type: 'success',
          text: uploadType === 'photo'
            ? `사진이 저장되었습니다. (메모리 ID: ${res.data.memoryId})`
            : `문서가 저장되었습니다. (${res.data.contentLength ?? 0}자)`,
        });
      } else {
        setMessage({ type: 'error', text: res.data.error ?? '업로드 실패' });
      }
    } catch (err: unknown) {
      let text = '업로드 중 오류가 발생했습니다.';
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const url = err.config?.url ?? endpoint;
        text = status != null
          ? `요청 실패 (${status}): ${url}`
          : err.message || text;
      } else if (err instanceof Error) {
        text = err.message;
      }
      setMessage({ type: 'error', text });
    } finally {
      setUploading(false);
      if (uploadType === 'photo') photoInputRef.current?.form?.reset();
      else docInputRef.current?.form?.reset();
    }
  };

  return (
    <section className="p-4 border-b border-zinc-800">
      <h2 className="text-xl font-bold mb-2">업로드</h2>
      <p className="text-zinc-400 text-sm mb-4">
        사진·문서를 올리면 자동으로 학습(Embedding + Qdrant)되어 검색·Timeline에 반영됩니다.
      </p>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-400">사진</span>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2 flex-wrap"
          >
            <input
              ref={photoInputRef}
              type="file"
              accept={PHOTO_ACCEPT}
              capture="environment"
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f, 'photo');
              }}
              disabled={uploading}
            />
          </form>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-400">문서 (PDF/DOCX/TXT/MD)</span>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2 flex-wrap"
          >
            <input
              ref={docInputRef}
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f, 'document');
              }}
              disabled={uploading}
            />
          </form>
        </div>
      </div>

      {uploading && <p className="text-zinc-500 text-sm mt-2">업로드 및 학습 중…</p>}
      {message && (
        <p
          className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
