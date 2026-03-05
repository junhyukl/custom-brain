import path from 'path';

const BRAIN_DATA = process.env.BRAIN_DATA_PATH ?? path.join(process.cwd(), 'brain-data');

export const STORAGE_CONFIG = {
  root: BRAIN_DATA,
  personal: {
    notes: path.join(BRAIN_DATA, 'personal', 'notes'),
    documents: path.join(BRAIN_DATA, 'personal', 'documents'),
    projects: path.join(BRAIN_DATA, 'personal', 'projects'),
  },
  family: {
    photos: path.join(BRAIN_DATA, 'family', 'photos'),
    history: path.join(BRAIN_DATA, 'family', 'history'),
    documents: path.join(BRAIN_DATA, 'family', 'documents'),
  },
};
