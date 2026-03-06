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

export interface BuildTimelineResult {
  total: number;
  withDate: number;
  byYear: Record<string, number>;
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

  /**
   * v2: 이벤트 텍스트를 메모리로 저장해 타임라인에 반영 (업로드 파이프라인에서 호출).
   */
  async addEvent(text: string, scope: MemoryScope = 'personal'): Promise<void> {
    const col = this.mongo.getMemoryCollection();
    await col.insertOne({
      id: `timeline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      scope,
      type: 'event',
      content: text,
      metadata: {},
      createdAt: new Date(),
    });
  }

  /**
   * Build timeline stats from all memories (date-aware for photos/documents).
   * Timeline API (getTimeline) reads from Mongo; this reports counts by year.
   */
  async buildTimeline(): Promise<BuildTimelineResult> {
    const col = this.mongo.getMemoryCollection();
    const docs = await col.find({}).toArray();
    const withDate = docs.filter((m) => m.metadata?.date || m.createdAt);
    const byYear: Record<string, number> = {};
    for (const m of withDate) {
      const dateStr = m.metadata?.date ?? m.createdAt?.toISOString?.() ?? '';
      const year = dateStr.slice(0, 4);
      if (year) byYear[year] = (byYear[year] ?? 0) + 1;
    }
    return { total: docs.length, withDate: withDate.length, byYear };
  }
}
