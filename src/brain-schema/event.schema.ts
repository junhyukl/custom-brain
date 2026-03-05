export interface Event {
  id: string;
  title: string;
  date: string;
  description?: string;
  people?: string[];
  location?: string;
  memoryIds?: string[];
  createdAt: Date;
}
