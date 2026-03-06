import { Inject, Injectable, Optional } from '@nestjs/common';
import axios from 'axios';
import { AI_SERVICE_URL } from '../common/constants';

export const AI_SERVICE_URL_OVERRIDE = Symbol('AI_SERVICE_URL_OVERRIDE');

export interface AnalyzePhotoResult {
  caption: string;
  people: string[];
  ocr: string;
  embedding: number[];
}

/**
 * v2 Python AI Service 클라이언트 (analyze-photo, embed).
 * AI_SERVICE_URL 이 설정된 경우에만 사용 가능.
 */
@Injectable()
export class AiServiceClient {
  private readonly baseURL: string;

  constructor(@Optional() @Inject(AI_SERVICE_URL_OVERRIDE) urlOverride?: string) {
    this.baseURL = (urlOverride ?? AI_SERVICE_URL).replace(/\/$/, '');
  }

  isAvailable(): boolean {
    return !!this.baseURL;
  }

  /** 사진 경로로 분석 요청 → caption, people, ocr, embedding */
  async analyzePhoto(filePath: string): Promise<AnalyzePhotoResult> {
    const { data } = await axios.post<AnalyzePhotoResult>(
      `${this.baseURL}/analyze-photo`,
      { path: filePath },
      { timeout: 120_000 },
    );
    return data;
  }

  /** 텍스트 → 벡터 (검색용 쿼리 임베딩 등) */
  async embed(text: string): Promise<number[]> {
    const { data } = await axios.post<{ vector: number[] }>(
      `${this.baseURL}/embed`,
      { text },
      { timeout: 30_000 },
    );
    return data.vector ?? [];
  }
}
