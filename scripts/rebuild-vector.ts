/**
 * Rebuild vector index from MongoDB memories (re-embed and upsert to Qdrant).
 * Usage: npx ts-node -r tsconfig-paths/register scripts/rebuild-vector.ts
 * Requires server running, or run as a Nest context script.
 * This script is a placeholder: full implementation would load all memories from Mongo,
 * call embedding API for each, and upsert to Qdrant. For now, use the API or run
 * the app and call GET /brain/memory/recall to verify data; rebuild logic can be
 * added as an admin endpoint (e.g. POST /brain/admin/rebuild-vector).
 */
console.log('Rebuild vector: run the app and use POST /brain/memory for each content to re-index.');
console.log('Or add an admin endpoint that loads from Mongo, re-embeds, and upserts to Qdrant.');
