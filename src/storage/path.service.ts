import { Injectable } from '@nestjs/common';
import path from 'path';
import { STORAGE_CONFIG } from '../config';

@Injectable()
export class PathService {
  get root(): string {
    return STORAGE_CONFIG.root;
  }

  personalNotes(): string {
    return STORAGE_CONFIG.personal.notes;
  }

  personalDocuments(): string {
    return STORAGE_CONFIG.personal.documents;
  }

  personalProjects(): string {
    return STORAGE_CONFIG.personal.projects;
  }

  personalPhotos(): string {
    return STORAGE_CONFIG.personal.photos;
  }

  familyPhotos(): string {
    return STORAGE_CONFIG.family.photos;
  }

  familyHistory(): string {
    return STORAGE_CONFIG.family.history;
  }

  familyDocuments(): string {
    return STORAGE_CONFIG.family.documents;
  }

  familyFacesJson(): string {
    return STORAGE_CONFIG.family.facesJson;
  }

  familyFacesSrc(): string {
    return STORAGE_CONFIG.family.facesSrc;
  }

  /** Resolve path under brain-data (e.g. family/photos/2020.jpg) */
  resolve(relativePath: string): string {
    return path.join(STORAGE_CONFIG.root, relativePath);
  }
}
