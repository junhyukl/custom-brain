import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import { detectFaces, type FaceMatch } from '../vision/face.recognition';
import { FaceService } from '../vision/face.service';
import { ImageDescribeService } from '../vision/image.describe';
import { extractExif } from '../vision/photo.metadata';
import { MemoryService } from '../brain-core/memory.service';
import { TimelineService } from '../brain-core/timeline.service';
import { FamilyService } from '../brain/family.service';
import { FamilyGraphService } from '../neo4j/family-graph.service';
import { AiServiceClient } from '../ai-service/ai-service.client';

export interface ProcessPhotoResult {
  memoryId: string;
  description: string;
  faces: FaceMatch[];
  personIds?: string[];
}

/**
 * Full pipeline: EXIF → Face detection & tagging → Family Graph 업데이트 → Description (Vision) → Embedding → Qdrant + Memory.
 * FACE_SERVICE_URL 이 있으면 InsightFace로 얼굴 임베딩 후 Qdrant faces 매칭/등록 + photo_together 엣지 추가.
 */
@Injectable()
export class PhotoProcessService {
  constructor(
    private readonly imageDescribe: ImageDescribeService,
    private readonly memory: MemoryService,
    private readonly faceService: FaceService,
    private readonly familyService: FamilyService,
    private readonly timelineService: TimelineService,
    private readonly aiService: AiServiceClient,
    private readonly familyGraphService: FamilyGraphService,
  ) {}

  async processPhoto(
    filePath: string,
    scope: 'personal' | 'family',
    options?: { metadataFilePath?: string },
  ): Promise<ProcessPhotoResult> {
    const metaPath = options?.metadataFilePath ?? filePath;
    // v2: AI Service 사용 시 캡션·임베딩을 Python 서비스에서 한 번에 받아 저장
    if (this.aiService.isAvailable()) {
      return this.processPhotoViaAiService(filePath, scope, metaPath);
    }
    return this.processPhotoLegacy(filePath, scope, metaPath);
  }

  private async processPhotoViaAiService(
    filePath: string,
    scope: 'personal' | 'family',
    metadataFilePath: string,
  ): Promise<ProcessPhotoResult> {
    const ai = await this.aiService.analyzePhoto(filePath);
    const caption = ai.caption || 'Photo (no caption)';
    let people: string[] = ai.people || [];
    let personIds: string[] = [];

    if (this.faceService.isAvailable()) {
      try {
        const detected = await this.faceService.detectFromPath(filePath);
        for (const face of detected) {
          const matched = await this.faceService.findPerson(face.embedding);
          let personId: string;
          let personName: string;
          if (matched) {
            personId = matched.personId;
            personName = matched.personName;
          } else {
            const person = await this.familyService.createPerson({
              name: `Unknown_${Date.now()}`,
              relation: 'child',
            });
            personId = person.id;
            personName = person.name;
            await this.faceService.storeFace(face.embedding, personId, personName, metadataFilePath);
          }
          personIds.push(personId);
          people.push(personName);
        }
        for (let i = 0; i < personIds.length; i++) {
          for (let j = i + 1; j < personIds.length; j++) {
            await this.familyService.addPhotoTogetherEdge(personIds[i], personIds[j], metadataFilePath);
          }
        }
      } catch {
        // face pipeline 실패 시 캡션만으로 진행
      }
    }

    await this.familyService.updatePeople(people);
    await this.familyGraphService.updatePeople(people);
    const embedding = ai.embedding?.length ? ai.embedding : undefined;
    const memory = embedding?.length
      ? await this.memory.storeWithVector(caption, embedding, {
          type: 'photo',
          scope,
          metadata: {
            filePath: metadataFilePath,
            people: people.length ? people : undefined,
            personIds: personIds.length ? personIds : undefined,
          },
        })
      : await this.memory.store(caption, {
          type: 'photo',
          scope,
          metadata: {
            filePath: metadataFilePath,
            people: people.length ? people : undefined,
            personIds: personIds.length ? personIds : undefined,
          },
        });
    for (const name of people) {
      await this.familyGraphService.linkPersonToPhoto(name, memory.id);
    }
    await this.timelineService.addEvent(caption, scope);

    return {
      memoryId: memory.id,
      description: caption,
      faces: people.map((name) => ({ name, confidence: 1 })),
      personIds: personIds.length ? personIds : undefined,
    };
  }

  private async processPhotoLegacy(
    filePath: string,
    scope: 'personal' | 'family',
    metadataFilePath: string,
  ): Promise<ProcessPhotoResult> {
    let exifDate: string | undefined;
    let exifLocation: string | undefined;
    try {
      const exif = extractExif(filePath);
      exifDate = exif.date;
      exifLocation = exif.location;
    } catch {
      // no EXIF or unsupported file
    }

    let people: string[] = [];
    let personIds: string[] = [];

    if (this.faceService.isAvailable()) {
      try {
        let detected = await this.faceService.detectFromPath(filePath);
        if (!detected.length) {
          const buffer = await fs.readFile(filePath);
          detected = await this.faceService.detectFromBuffer(buffer);
        }
        for (const face of detected) {
          const matched = await this.faceService.findPerson(face.embedding);
          let personId: string;
          let personName: string;
          if (matched) {
            personId = matched.personId;
            personName = matched.personName;
          } else {
            const person = await this.familyService.createPerson({
              name: `Unknown_${Date.now()}`,
              relation: 'child',
            });
            personId = person.id;
            personName = person.name;
            await this.faceService.storeFace(face.embedding, personId, personName, filePath);
          }
          personIds.push(personId);
          people.push(personName);
        }
        for (let i = 0; i < personIds.length; i++) {
          for (let j = i + 1; j < personIds.length; j++) {
            await this.familyService.addPhotoTogetherEdge(personIds[i], personIds[j], filePath);
          }
        }
      } catch {
        // fallback: 기존 face-api
      }
    }

    let faceMatches: FaceMatch[] = [];
    if (people.length === 0) {
      const faces = await detectFaces(filePath);
      faceMatches = faces;
      people = faces.map((f) => f.name).filter((n) => n !== 'unknown');
      for (const name of people) {
        let person = await this.familyService.findPersonByName(name);
        if (!person) {
          person = await this.familyService.createPerson({ name, relation: 'child' });
        }
        personIds.push(person.id);
      }
      for (let i = 0; i < personIds.length; i++) {
        for (let j = i + 1; j < personIds.length; j++) {
          await this.familyService.addPhotoTogetherEdge(personIds[i], personIds[j], filePath);
        }
      }
    } else {
      faceMatches = people.map((name) => ({ name, confidence: 1 }));
    }

    const description = await this.imageDescribe.describeFromPath(filePath, true);
    const memory = await this.memory.store(description, {
      type: 'photo',
      scope,
      metadata: {
        filePath: metadataFilePath,
        people: people.length ? people : undefined,
        personIds: personIds.length ? personIds : undefined,
        date: exifDate,
        location: exifLocation,
      },
    });
    for (const name of people) {
      await this.familyGraphService.linkPersonToPhoto(name, memory.id);
    }

    return {
      memoryId: memory.id,
      description,
      faces: faceMatches,
      personIds: personIds.length ? personIds : undefined,
    };
  }
}
