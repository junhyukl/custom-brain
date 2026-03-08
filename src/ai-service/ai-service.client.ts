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

  /** 음성 파일 경로 → Whisper STT → 텍스트. AI_SERVICE_URL 서버가 해당 path를 읽을 수 있어야 함. */
  async transcribe(filePath: string): Promise<string> {
    if (!this.baseURL) return '';
    try {
      const { data } = await axios.post<{ text?: string; error?: string }>(
        `${this.baseURL}/transcribe`,
        { path: filePath },
        { timeout: 120_000 },
      );
      if (data.error) return '';
      return (data.text ?? '').trim();
    } catch {
      return '';
    }
  }

  /** Whisper STT + 선택적 화자 구분(pyannote). segments는 HUGGINGFACE_TOKEN 있을 때만. */
  async transcribeWithSpeakers(
    filePath: string,
  ): Promise<{ text: string; segments: { speaker: string; start: number; end: number }[] }> {
    if (!this.baseURL) return { text: '', segments: [] };
    try {
      const { data } = await axios.post<{
        text?: string;
        segments?: { speaker: string; start: number; end: number }[];
        error?: string;
      }>(`${this.baseURL}/transcribe-with-speakers`, { path: filePath }, { timeout: 180_000 });
      if (data.error) return { text: '', segments: [] };
      return {
        text: (data.text ?? '').trim(),
        segments: data.segments ?? [],
      };
    } catch {
      return { text: '', segments: [] };
    }
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

  /** v3: 벡터 목록 KMeans 클러스터링 → 인덱스별 cluster label */
  async cluster(vectors: number[][]): Promise<number[]> {
    if (!vectors.length) return [];
    const { data } = await axios.post<{ clusters: number[] }>(
      `${this.baseURL}/cluster`,
      { vectors },
      { timeout: 60_000 },
    );
    return data.clusters ?? [];
  }

  /** v3: 메모리 텍스트 목록 요약 */
  async summarize(memories: string[]): Promise<string> {
    if (!memories.length) return '';
    const { data } = await axios.post<{ summary: string }>(
      `${this.baseURL}/summarize`,
      { memories },
      { timeout: 90_000 },
    );
    return data.summary ?? '';
  }

  /** v3: 메모리에서 시간순 타임라인 텍스트 생성 */
  async timeline(memories: string[]): Promise<string> {
    if (!memories.length) return '';
    const { data } = await axios.post<{ timeline: string }>(
      `${this.baseURL}/timeline`,
      { memories },
      { timeout: 90_000 },
    );
    return data.timeline ?? '';
  }
}
