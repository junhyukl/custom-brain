import { Controller, Get, Query } from '@nestjs/common';
import { TimelineService } from '../brain-core/timeline.service';
import type { MemoryScope } from '../brain-schema';

@Controller('brain')
export class TimelineController {
  constructor(private readonly timeline: TimelineService) {}

  @Get('timeline')
  async getTimeline(
    @Query('scope') scope?: MemoryScope,
    @Query('limit') limit?: string,
  ) {
    const timeline = await this.timeline.getTimeline(
      scope,
      limit ? Number(limit) : 100,
    );
    return { timeline };
  }
}
