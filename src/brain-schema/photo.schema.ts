export interface PhotoMemory {
  id: string;
  filePath: string;
  description: string;
  embedding?: number[];
  people?: string[];
  location?: string;
  date?: string;
  createdAt?: Date;
}
