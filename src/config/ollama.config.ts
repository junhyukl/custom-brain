export const OLLAMA_CONFIG = {
  baseUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  defaultModel: process.env.LLM_MODEL ?? 'mistral:7b-instruct',
  embeddingModel: process.env.EMBEDDING_MODEL ?? 'nomic-embed-text',
  visionModel: process.env.VISION_MODEL ?? 'llava',
};
