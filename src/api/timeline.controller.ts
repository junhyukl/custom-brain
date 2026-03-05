import { Controller, Get, Query } from '@nestjs/common';
import { TimelineService } from '../brain-core/timeline.service';
import { toErrorMessage } from '../common/error.util';
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
      const limitN = limit != null && limit !== '' ? Number(limit) : 100;
      const timeline = await this.timeline.getTimeline(scope, limitN);
      return { timeline };
    } catch (err) {
      const message = toErrorMessage(err);
      console.error('[brain/timeline]', message);
      return { timeline: [], error: message };
    }
  }
}
