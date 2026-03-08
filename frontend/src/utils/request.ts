import axios from 'axios';

/** API 응답 body에서 에러 메시지 추출 (error 또는 message 필드) */
export function getApiErrorMessage(data: unknown): string | null {
  if (data && typeof data === 'object') {
    const d = data as { error?: string; message?: string };
    if (typeof d.error === 'string') return d.error;
    if (typeof d.message === 'string') return d.message;
  }
  return null;
}

/** API/UI용 에러 메시지 추출 (axios 에러 또는 일반 에러) */
export function toErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg =
      getApiErrorMessage(err.response?.data) ??
      err.message ??
      '요청 중 오류가 발생했습니다.';
    const status = err.response?.status;
    if (status != null) return `요청 실패 (${status}): ${msg}`;
    return msg;
  }
  return err instanceof Error ? err.message : String(err);
}
