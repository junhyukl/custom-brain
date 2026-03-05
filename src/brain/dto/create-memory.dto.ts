import type { MemoryScope, MemoryType, MemoryMetadata } from '../../brain-schema';

export class CreateMemoryDto {
  content!: string;
  scope?: MemoryScope;
  type?: MemoryType;
  metadata?: MemoryMetadata;
  source?: string;
}
