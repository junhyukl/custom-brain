import { Injectable } from '@nestjs/common';
import { TimelineService } from '../brain-core/timeline.service';
import type { TimelineEntry } from '../brain-core/timeline.service';

export interface TimelineToolInput {
  scope?: 'personal' | 'family';
  limit?: number;
}

@Injectable()
export class TimelineTool {
  name = 'timeline';
  description = 'Get memory timeline (events ordered by date)';

  constructor(private readonly timeline: TimelineService) {}

  async execute(input?: TimelineToolInput): Promise<TimelineEntry[]> {
    return this.timeline.getTimeline(input?.scope, input?.limit ?? 100);
  }
}
