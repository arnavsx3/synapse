function positiveInteger(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export const RAG_CONFIG = {
  chunkSize: positiveInteger("RAG_CHUNK_SIZE", 1_200),
  chunkOverlap: positiveInteger("RAG_CHUNK_OVERLAP", 200),
  retrievalLimit: positiveInteger("RAG_RETRIEVAL_LIMIT", 8),
  maxChunksPerContext: positiveInteger("RAG_MAX_CHUNKS_PER_CONTEXT", 2),
  minimumVectorSimilarity: Number(process.env.RAG_MINIMUM_SIMILARITY ?? 0.2),
  maxQueryLength: positiveInteger("RAG_MAX_QUERY_LENGTH", 2_000),
} as const;

export const EMBEDDING_STATUS_VALUES = [
  "pending",
  "processing",
  "completed",
  "failed",
  "degraded",
] as const;

export type EmbeddingStatus = (typeof EMBEDDING_STATUS_VALUES)[number];
