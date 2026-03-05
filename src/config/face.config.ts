import path from 'path';

export const FACE_MODEL_PATH =
  process.env.FACE_MODEL_PATH ?? path.join(process.cwd(), 'face-models');

export const FACE_MATCH_THRESHOLD = 0.6;
