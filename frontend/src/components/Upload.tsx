import { useState, useRef } from 'react';
import axios from 'axios';
import { PHOTO_ACCEPT, DOCUMENT_ACCEPT, VOICE_ACCEPT } from '../constants';
import { toErrorMessage } from '../utils/request';
import { BatchUpload } from './batchUpload';

type UploadType = 'photo' | 'document' | 'voice';

type UploadSuccess = { success: true; memoryId: string; error?: never };
type UploadError = { success: false; error: string; memoryId?: never };
type PhotoRes = UploadSuccess & { filePath?: string };
type DocumentRes = UploadSuccess & { contentLength?: number };
type VoiceRes = UploadSuccess & { filePath?: string; textLength?: number };
type UploadResponse = PhotoRes | DocumentRes | VoiceRes | UploadError;

const UPLOAD_ENDPOINTS: Record<UploadType, string> = {
  photo: '/brain/upload/photo',
  document: '/brain/upload/document',
  voice: '/brain/upload/voice',
};

const FILE_INPUT_CLASS =
  'block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-blue-700';

function FileInputRow({
  label,
  accept,
  inputRef,
  disabled,
  onFile,
  capture,
  children,
}: {
  label: string;
  accept: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onFile: (file: File) => void;
  capture?: 'environment';
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-400">{label}</span>
      <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="file"
          accept={accept}
          capture={capture}
          className={FILE_INPUT_CLASS}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
          disabled={disabled}
        />
        {children}
      </form>
    </div>
  );
}

function getSuccessMessage(type: UploadType, data: UploadSuccess & Record<string, unknown>): string {
  switch (type) {
    case 'photo':
      return `사진이 저장되었습니다. (메모리 ID: ${data.memoryId})`;
    case 'document':
      return `문서가 저장되었습니다. (${(data as DocumentRes).contentLength ?? 0}자)`;
    case 'voice':
      return `음성이 저장되었습니다. (${(data as VoiceRes).textLength ?? 0}자, 메모리 ID: ${data.memoryId})`;
    default:
      return '저장되었습니다.';
  }
}

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [voiceSpeaker, setVoiceSpeaker] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const inputRefs: Record<UploadType, React.RefObject<HTMLInputElement | null>> = {
    photo: photoInputRef,
    document: docInputRef,
    voice: voiceInputRef,
  };

  const handleFile = async (file: File, uploadType: UploadType) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    if (uploadType === 'voice' && voiceSpeaker.trim()) {
      formData.append('speaker', voiceSpeaker.trim());
    }
    try {
      const res = await axios.post<UploadResponse>(UPLOAD_ENDPOINTS[uploadType], formData, {
        headers: {},
      });
      const isSuccess = res.data.success;
      setMessage({
        type: isSuccess ? 'success' : 'error',
        text: isSuccess ? getSuccessMessage(uploadType, res.data) : (res.data as UploadError).error,
      });
    } catch (err: unknown) {
      setMessage({ type: 'error', text: toErrorMessage(err) });
    } finally {
      setUploading(false);
      inputRefs[uploadType].current?.form?.reset();
    }
  };

  return (
    <section className="p-4 border-b border-zinc-800">
      <h2 className="text-xl font-bold mb-2">업로드</h2>
      <p className="text-zinc-400 text-sm mb-4">
        사진·문서를 올리면 자동으로 학습(Embedding + Qdrant)되어 검색·Timeline에 반영됩니다.
      </p>

      <div className="flex flex-wrap gap-4 items-end">
        <FileInputRow
          label="사진"
          accept={PHOTO_ACCEPT}
          inputRef={photoInputRef}
          disabled={uploading}
          onFile={(f) => handleFile(f, 'photo')}
          capture="environment"
        />
        <FileInputRow
          label="문서 (PDF/DOCX/TXT/MD)"
          accept={DOCUMENT_ACCEPT}
          inputRef={docInputRef}
          disabled={uploading}
          onFile={(f) => handleFile(f, 'document')}
        />
        <FileInputRow
          label="음성 (MP3/WAV/M4A 등 → Whisper STT)"
          accept={VOICE_ACCEPT}
          inputRef={voiceInputRef}
          disabled={uploading}
          onFile={(f) => handleFile(f, 'voice')}
        >
          <input
            type="text"
            value={voiceSpeaker}
            onChange={(e) => setVoiceSpeaker(e.target.value)}
            placeholder="화자 (예: 아버지, father)"
            className="px-3 py-2 rounded-lg border border-zinc-600 bg-zinc-900 text-zinc-200 placeholder-zinc-500 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FileInputRow>
      </div>

      {uploading && <p className="text-zinc-500 text-sm mt-2">업로드 및 학습 중…</p>}
      {message && (
        <p
          className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
        >
          {message.text}
        </p>
      )}

      <BatchUpload />
    </section>
  );
}
