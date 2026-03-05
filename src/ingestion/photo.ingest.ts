import { Injectable } from '@nestjs/common';
import { ImageDescribeService } from '../vision/image.describe';
import { MemoryService } from '../brain-core/memory.service';

@Injectable()
export class PhotoIngestService {
  constructor(
    private readonly vision: ImageDescribeService,
    private readonly memory: MemoryService,
  ) {}

  /**
   * Ingest photo: describe with vision → embed description → store as memory (type: photo).
   */
  async ingestPhoto(
    imageBase64: string,
    options?: { filePath?: string; date?: string; people?: string[] },
  ): Promise<{ description: string; memoryId: string }> {
    const description = await this.vision.describe(imageBase64);
    const memory = await this.memory.store(description, {
      type: 'photo',
      scope: 'family',
      metadata: {
        filePath: options?.filePath,
        date: options?.date,
        people: options?.people,
      },
    });
    return { description, memoryId: memory.id };
  }
}
