import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MemoryService } from '../brain-core/memory.service';
import { CreateMemoryDto } from '../brain/dto';
import { DEFAULT_RECALL_LIMIT, parseLimit } from '../common/constants';
import { toErrorMessage } from '../common/error.util';
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
    const content = body?.content?.trim();
    if (!content) {
      throw new BadRequestException('content is required and must be non-empty');
    }
    try {
      return await this.memory.store(content, {
      scope: body.scope,
      type: body.type,
      metadata: body.metadata,
      source: body.source,
    });
    } catch (err) {
      throw new HttpException(
        { error: toErrorMessage(err) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('memory/recall')
  async recall(@Query('limit') limit?: string): Promise<{ memories: Memory[] }> {
    const list = await this.memory.recall(parseLimit(limit, DEFAULT_RECALL_LIMIT));
    return { memories: list };
  }

  @Get('memory/:id')
  async getById(@Param('id') id: string): Promise<Memory | null> {
    if (!id?.trim()) {
      throw new BadRequestException('memory id is required');
    }
    try {
      const doc = await this.memory.getById(id);
      if (!doc) return null;
      return this.normalizeMemoryForResponse(doc);
    } catch (err) {
      throw new HttpException(
        { error: toErrorMessage(err) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** Mongo document → JSON-safe shape (createdAt 문자열로 직렬화) */
  private normalizeMemoryForResponse(m: Memory): Memory {
    const createdAt =
      m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt ?? '');
    return { ...m, createdAt } as unknown as Memory;
  }

  @Patch('memory/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateMemoryDto,
  ): Promise<Memory | null> {
    try {
      const updated = await this.memory.update(id, {
        content: body.content,
        metadata: body.metadata,
      });
      return updated ? this.normalizeMemoryForResponse(updated) : null;
    } catch (err) {
      throw new HttpException(
        { error: toErrorMessage(err) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('memory/:id')
  async delete(@Param('id') id: string): Promise<{ deleted: boolean; error?: string }> {
    try {
      return await this.memory.delete(id);
    } catch (err) {
      throw new HttpException(
        { error: toErrorMessage(err) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** 타임라인(메모리) 전부 비우기. Mongo + Qdrant 컬렉션 삭제. */
  @Delete('memories/clear')
  async clearAll(): Promise<{ mongoDeleted: number }> {
    try {
      return await this.memory.clearAll();
    } catch (err) {
      throw new HttpException(
        { error: toErrorMessage(err) },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
