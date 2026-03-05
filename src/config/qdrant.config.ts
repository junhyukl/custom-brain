import { EMBEDDING_DIMENSION } from '../common/constants';

export const QDRANT_CONFIG = {
  url: process.env.QDRANT_URL ?? 'http://localhost:6333',
  collectionName: 'memories',
  vectorSize: EMBEDDING_DIMENSION,
  distance: 'Cosine' as const,
};
