/**
 * Face recognition via Python InsightFace service + Qdrant faces collection.
 * FACE_SERVICE_URL 이 설정되어 있으면 사진 업로드 시 이 서비스로 얼굴 임베딩을 받아 매칭/등록.
 */
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import axios from 'axios';
import FormData from 'form-data';
import { VectorStore } from '../vector/vectorStore';
import {
  FACE_SERVICE_URL,
  COLLECTION_FACES,
  FACE_EMBEDDING_DIMENSION,
  FACE_MATCH_THRESHOLD,
} from '../common/constants';

export interface DetectedFace {
  embedding: number[];
  bbox: number[];
}

@Injectable()
export class FaceService {
  constructor(private readonly vector: VectorStore) {}

  /** Python Face Service가 사용 가능한지 */
  isAvailable(): boolean {
    return !!FACE_SERVICE_URL;
  }

  /** 이미지 버퍼를 Face Service에 보내 얼굴 검출 + 임베딩 반환 */
  async detectFromBuffer(buffer: Buffer): Promise<DetectedFace[]> {
    if (!FACE_SERVICE_URL) return [];
    const form = new FormData();
    form.append('file', buffer, { filename: 'photo.jpg' });
    try {
      const res = await axios.post<{ faces: DetectedFace[]; error?: string }>(
        `${FACE_SERVICE_URL}/detect`,
        form,
        { headers: form.getHeaders(), maxBodyLength: Infinity, timeout: 30_000 },
      );
      return res.data.faces ?? [];
    } catch {
      return [];
    }
  }

  /** 로컬 파일 경로로 Face Service 분석 (동일 호스트/공유 볼륨). 대용량·이중 읽기 방지. */
  async detectFromPath(filePath: string): Promise<DetectedFace[]> {
    if (!FACE_SERVICE_URL) return [];
    try {
      const res = await axios.post<{ faces: DetectedFace[]; error?: string }>(
        `${FACE_SERVICE_URL}/analyze-face`,
        { path: filePath },
        { timeout: 30_000 },
      );
      return res.data.faces ?? [];
    } catch {
      return [];
    }
  }

  /** Qdrant faces 컬렉션 준비 */
  private async ensureFacesCollection(): Promise<void> {
    await this.vector.ensureCollection(COLLECTION_FACES, FACE_EMBEDDING_DIMENSION);
  }

  /** 임베딩으로 기존 인물 매칭. threshold 이상이면 해당 person 반환 */
  async findPerson(embedding: number[]): Promise<{ personId: string; personName: string } | null> {
    await this.ensureFacesCollection();
    const results = await this.vector.search(COLLECTION_FACES, embedding, 1);
    const top = results[0];
    if (!top || top.score < FACE_MATCH_THRESHOLD) return null;
    const payload = top.payload ?? {};
    const personId = payload.personId as string;
    const personName = payload.personName as string;
    if (personId && personName) return { personId, personName };
    return null;
  }

  /** 새 얼굴을 Qdrant에 등록 (personId, personName, photoPath) */
  async storeFace(
    embedding: number[],
    personId: string,
    personName: string,
    photoPath: string,
  ): Promise<void> {
    await this.ensureFacesCollection();
    const id = randomUUID();
    await this.vector.upsert(COLLECTION_FACES, [
      {
        id,
        vector: embedding,
        payload: { personId, personName, photoPath },
      },
    ]);
  }
}
