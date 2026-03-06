import { Injectable } from '@nestjs/common';
import fs from 'fs/promises';
import { detectFaces, type FaceMatch } from '../vision/face.recognition';
import { FaceService } from '../vision/face.service';
import { ImageDescribeService } from '../vision/image.describe';
import { extractExif } from '../vision/photo.metadata';
import { MemoryService } from '../brain-core/memory.service';
import { FamilyService } from '../brain/family.service';

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
  ) {}

  async processPhoto(
    filePath: string,
    scope: 'personal' | 'family',
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
        const buffer = await fs.readFile(filePath);
        const detected = await this.faceService.detectFromBuffer(buffer);
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
        filePath,
        people: people.length ? people : undefined,
        personIds: personIds.length ? personIds : undefined,
        date: exifDate,
        location: exifLocation,
      },
    });

    return {
      memoryId: memory.id,
      description,
      faces: faceMatches,
      personIds: personIds.length ? personIds : undefined,
    };
  }
}
