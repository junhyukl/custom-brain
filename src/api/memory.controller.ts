import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';
import { CreateMemoryDto } from '../brain/dto';

@Controller('brain')
export class MemoryController {
  constructor(private readonly memory: MemoryService) {}

  @Post('memory')
  async create(
    @Body() body: CreateMemoryDto,
  ) {
    return this.memory.store(body.content, {
      scope: body.scope,
      type: body.type,
      metadata: body.metadata,
      source: body.source,
    });
  }

  @Get('memory/recall')
  async recall(@Query('limit') limit?: string) {
    const list = await this.memory.recall(limit ? Number(limit) : 50);
    return { memories: list };
  }
}
