import type { MemoryScope, MemoryType, MemoryMetadata } from '../../schemas';

export class CreateMemoryDto {
  content!: string;
  scope?: MemoryScope;
  type?: MemoryType;
  metadata?: MemoryMetadata;
  source?: string;
}
