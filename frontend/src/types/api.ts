/** Search / memory result item (photos, documents, memory search). */
export interface MemoryHit {
  id: string;
  content: string;
  type?: string;
  metadata?: {
    filePath?: string;
    people?: string[];
    date?: string;
    location?: string;
  };
}

/** Timeline list item from GET /brain/timeline */
export interface TimelineEntry {
  date: string;
  description: string;
  memoryId: string;
  type: string;
  scope: string;
}

/** Full memory document from GET /brain/memory/:id */
export interface MemoryDetail {
  id: string;
  content: string;
  type: string;
  scope: string;
  metadata: { date?: string; filePath?: string; people?: string[]; location?: string };
  createdAt: string;
}

/** PATCH /brain/memory/:id body */
export interface UpdateMemoryBody {
  content?: string;
  metadata?: { date?: string; people?: string[]; location?: string };
}
