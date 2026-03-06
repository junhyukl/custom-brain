import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const DEFAULT_CONFIRM_MESSAGE =
  '이 메모리와 연결된 파일·벡터 데이터를 모두 삭제합니다. 계속할까요?';

export function useDeleteMemory() {
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const deleteMemory = useCallback(
    async (
      id: string,
      options?: {
        onSuccess?: () => void;
        confirmMessage?: string;
      },
    ) => {
      if (!id || inFlightRef.current) return;
      const msg = options?.confirmMessage ?? DEFAULT_CONFIRM_MESSAGE;
      if (!confirm(msg)) return;
      inFlightRef.current = true;
      setLoading(true);
      try {
        const res = await axios.delete<{ deleted: boolean; error?: string }>(
          `/brain/memory/${id}`,
        );
        if (res.data?.deleted) {
          options?.onSuccess?.();
        } else {
          alert(res.data?.error ?? '삭제에 실패했습니다.');
        }
      } catch {
        alert('삭제 요청 중 오류가 발생했습니다.');
      } finally {
        inFlightRef.current = false;
        if (isMountedRef.current) setLoading(false);
      }
    },
    [],
  );

  return { deleteMemory, loading };
}
