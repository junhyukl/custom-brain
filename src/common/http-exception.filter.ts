import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { toErrorMessage } from './error.util';
import type { ApiErrorResponse } from './api-response.types';

/**
 * 전역 예외 필터. 모든 예외를 일관된 API 에러 형식으로 변환.
 * - HttpException: status + message 사용
 * - 그 외: 500 + toErrorMessage(err)
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string;
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        if ('error' in body && typeof (body as { error?: string }).error === 'string') {
          message = (body as { error: string }).error;
        } else if ('message' in body) {
          const msg = (body as { message?: string | string[] }).message;
          message = Array.isArray(msg) ? msg[0] ?? exception.message : (msg as string) ?? exception.message;
        } else {
          message = exception.message;
        }
      } else {
        message = exception.message;
      }
      code = status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
    } else {
      message = toErrorMessage(exception);
      code = 'INTERNAL_ERROR';
      this.logger.warn(`${req.method} ${req.url} ${status} ${message}`);
    }

    const payload: ApiErrorResponse & Record<string, unknown> = {
      success: false,
      error: message,
      ...(code ? { code } : {}),
    };
    if (exception instanceof HttpException) {
      const orig = exception.getResponse();
      if (typeof orig === 'object' && orig !== null && !Array.isArray(orig)) {
        Object.assign(payload, orig);
        payload.success = false;
        payload.error = (orig as { error?: string }).error ?? message;
      }
    }
    res.status(status).json(payload);
  }
}
