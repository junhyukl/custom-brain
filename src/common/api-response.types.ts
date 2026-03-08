/**
 * 공통 API 응답 형식. Global Exception Filter 및 컨트롤러에서 일관된 형태 사용.
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function isApiError(r: ApiResponse): r is ApiErrorResponse {
  return r && (r as ApiErrorResponse).success === false;
}
