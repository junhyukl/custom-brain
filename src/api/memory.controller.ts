import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';
import { CreateMemoryDto } from '../brain/dto';
import { DEFAULT_RECALL_LIMIT, parseLimit } from '../common/constants';
import type { Memory } from '../schemas';

export class UpdateMemoryDto {
  content?: string;
  metadata?: { date?: string; people?: string[]; location?: string };
}

@Controller('brain')
export class MemoryController {
  constructor(private readonly memory: MemoryService) {}

  @Post('memory')
  async create(@Body() body: CreateMemoryDto): Promise<Memory> {
    return this.memory.store(body.content, {
      scope: body.scope,
      type: body.type,
      metadata: body.metadata,
      source: body.source,
    });
  }

  @Get('memory/recall')
  async recall(@Query('limit') limit?: string): Promise<{ memories: Memory[] }> {
    const list = await this.memory.recall(parseLimit(limit, DEFAULT_RECALL_LIMIT));
    return { memories: list };
  }

  @Get('memory/:id')
  async getById(@Param('id') id: string): Promise<Memory | null> {
    return this.memory.getById(id);
  }

  @Patch('memory/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateMemoryDto,
  ): Promise<Memory | null> {
    return this.memory.update(id, {
      content: body.content,
      metadata: body.metadata,
    });
  }

  @Delete('memory/:id')
  async delete(@Param('id') id: string): Promise<{ deleted: boolean; error?: string }> {
    return this.memory.delete(id);
  }

  /** 타임라인(메모리) 전부 비우기. Mongo + Qdrant 컬렉션 삭제. */
  @Delete('memories/clear')
  async clearAll(): Promise<{ mongoDeleted: number }> {
    return this.memory.clearAll();
  }
}
