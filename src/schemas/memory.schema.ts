export type MemoryScope = 'personal' | 'family';

export type MemoryType = 'note' | 'document' | 'photo' | 'event' | 'conversation';

export interface MemoryMetadata {
  people?: string[];
  personIds?: string[];
  location?: string;
  date?: string;
  source?: string;
  filePath?: string;
  /** v3: cluster label from KMeans (0..n-1) */
  clusterId?: number;
  /** v3: optional topic label for cluster */
  clusterTopic?: string;
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
