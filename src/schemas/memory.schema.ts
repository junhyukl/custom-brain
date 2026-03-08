export type MemoryScope = 'personal' | 'family';

export type MemoryType = 'note' | 'document' | 'photo' | 'event' | 'conversation' | 'voice';

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
  /** Voice memory: 화자(예: father, 아버지). Face + Voice 연결용 */
  speaker?: string;
  /** Voice: pyannote 화자 구분 시 SPEAKER_00 등 목록 */
  speakers?: string[];
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
