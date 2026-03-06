export type MemoryScope = 'personal' | 'family';

export type MemoryType = 'note' | 'document' | 'photo' | 'event' | 'conversation';

export interface MemoryMetadata {
  people?: string[];
  personIds?: string[];
  location?: string;
  date?: string;
  source?: string;
  filePath?: string;
}

export interface Memory {
  id: string;
  scope: MemoryScope;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: MemoryMetadata;
  createdAt: Date;
}
