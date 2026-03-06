import axios from 'axios';

/** API 응답/UI용 에러 메시지 추출 */
export function toErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const msg =
      err.response?.data?.error ?? err.message ?? '요청 중 오류가 발생했습니다.';
    if (status != null) return `요청 실패 (${status}): ${msg}`;
    return msg;
  }
  return err instanceof Error ? err.message : String(err);
}
