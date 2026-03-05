import { Injectable } from '@nestjs/common';
import { MongoService } from '../mongo/mongo.service';
import type { MemoryScope } from '../brain-schema';

export interface TimelineEntry {
  date: string;
  description: string;
  memoryId: string;
  type: string;
  scope: string;
}

@Injectable()
export class TimelineService {
  constructor(private readonly mongo: MongoService) {}

  async getTimeline(scope?: MemoryScope, limit = 100): Promise<TimelineEntry[]> {
    const col = this.mongo.getMemoryCollection();
    const filter = scope ? { scope } : {};
    const docs = await col.find(filter).sort({ createdAt: 1 }).limit(limit).toArray();
    return docs
      .filter((m) => m.metadata?.date || m.createdAt)
      .map((m) => ({
        date: m.metadata?.date ?? m.createdAt.toISOString().slice(0, 10),
        description: m.content.slice(0, 200),
        memoryId: m.id,
        type: m.type,
        scope: m.scope,
      }));
  }
}
