import path from 'path';

const BRAIN_DATA = process.env.BRAIN_DATA_PATH ?? path.join(process.cwd(), 'brain-data');

export const STORAGE_CONFIG = {
  root: BRAIN_DATA,
  personal: {
    notes: path.join(BRAIN_DATA, 'personal', 'notes'),
    documents: path.join(BRAIN_DATA, 'personal', 'documents'),
    projects: path.join(BRAIN_DATA, 'personal', 'projects'),
    photos: path.join(BRAIN_DATA, 'personal', 'photos'),
  },
  family: {
    photos: path.join(BRAIN_DATA, 'family', 'photos'),
    history: path.join(BRAIN_DATA, 'family', 'history'),
    documents: path.join(BRAIN_DATA, 'family', 'documents'),
    /** 가족 얼굴 DB (faces.json) 및 학습용 사진 (faces_src/) */
    facesJson: path.join(BRAIN_DATA, 'family', 'faces.json'),
    facesSrc: path.join(BRAIN_DATA, 'family', 'faces_src'),
  },
};
