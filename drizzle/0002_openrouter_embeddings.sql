-- OpenRouter's free Nemotron embedding route returns 2,048 dimensions.
-- Existing vectors cannot be reused across embedding models, so clear only
-- the old vectors and let the worker rebuild them from the stored chunks.
DELETE FROM "context_chunk_embedding";

ALTER TABLE "context_chunk_embedding"
  ALTER COLUMN "embedding" TYPE vector(2048);

UPDATE "context_item"
SET
  "embedding_status" = 'pending',
  "embedding_error" = NULL,
  "embedding_updated_at" = NULL;
