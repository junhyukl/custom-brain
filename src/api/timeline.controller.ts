import { Controller, Get, Query } from '@nestjs/common';
import { TimelineService } from '../brain-core/timeline.service';
import { toErrorMessage } from '../common/error.util';
import { DEFAULT_TIMELINE_LIMIT, parseLimit } from '../common/constants';
import type { MemoryScope } from '../brain-schema';
import type { TimelineEntry } from '../brain-core/timeline.service';

@Controller('brain')
export class TimelineController {
  constructor(private readonly timeline: TimelineService) {}

  @Get('timeline')
  async getTimeline(
    @Query('scope') scope?: MemoryScope,
    @Query('limit') limit?: string,
  ): Promise<{ timeline: TimelineEntry[]; error?: string }> {
    try {
      const timeline = await this.timeline.getTimeline(
        scope,
        parseLimit(limit, DEFAULT_TIMELINE_LIMIT),
      );
      return { timeline };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/timeline]', message);
      return { timeline: [], error: message };
    }
  }
}
