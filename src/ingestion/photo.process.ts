import { Injectable } from '@nestjs/common';
import { detectFaces, type FaceMatch } from '../vision/face.recognition';
import { ImageDescribeService } from '../vision/image.describe';
import { MemoryService } from '../brain-core/memory.service';

export interface ProcessPhotoResult {
  memoryId: string;
  description: string;
  faces: FaceMatch[];
}

/**
 * Full pipeline: Face detection & tagging → Description (Vision) → Embedding → Qdrant + Memory.
 */
@Injectable()
export class PhotoProcessService {
  constructor(
    private readonly imageDescribe: ImageDescribeService,
    private readonly memory: MemoryService,
  ) {}

  async processPhoto(
    filePath: string,
    scope: 'personal' | 'family',
  ): Promise<ProcessPhotoResult> {
    const faces = await detectFaces(filePath);
    const description = await this.imageDescribe.describeFromPath(filePath, true);
    const people = faces.map((f) => f.name).filter((n) => n !== 'unknown');
    const memory = await this.memory.store(description, {
      type: 'photo',
      scope,
      metadata: {
        filePath,
        people: people.length ? people : undefined,
      },
    });
    return {
      memoryId: memory.id,
      description,
      faces,
    };
  }
}
