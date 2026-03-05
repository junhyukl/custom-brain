/** Memory scope */
export type MemoryScope = 'personal' | 'family';

/** Memory type */
export type MemoryType = 'note' | 'document' | 'photo' | 'event' | 'conversation';

/** Person relation in family graph */
export type PersonRelation =
  | 'father'
  | 'mother'
  | 'grandfather'
  | 'grandmother'
  | 'child'
  | 'spouse'
  | 'sibling';

export interface MemoryMetadata {
  people?: string[];
  location?: string;
  date?: string;
  source?: string;
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

export interface Person {
  id: string;
  name: string;
  relation: PersonRelation;
  birthDate?: string;
  description?: string;
  /** Parent person ids for tree building */
  parentIds?: string[];
}
