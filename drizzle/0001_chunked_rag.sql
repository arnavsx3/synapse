CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "context_item"
  ADD COLUMN IF NOT EXISTS "chunk_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "embedding_status" text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS "embedding_error" text,
  ADD COLUMN IF NOT EXISTS "embedding_updated_at" timestamp;

CREATE TABLE IF NOT EXISTS "context_chunk" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "context_id" uuid NOT NULL REFERENCES "context_item"("id") ON DELETE CASCADE,
  "chunk_index" integer NOT NULL,
  "content" text NOT NULL,
  "start_char" integer NOT NULL,
  "end_char" integer NOT NULL,
  "character_count" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "context_chunk_context_index_idx"
  ON "context_chunk" ("context_id", "chunk_index");
CREATE INDEX IF NOT EXISTS "context_chunk_context_id_idx"
  ON "context_chunk" ("context_id");

CREATE TABLE IF NOT EXISTS "context_chunk_embedding" (
  "chunk_id" uuid PRIMARY KEY NOT NULL REFERENCES "context_chunk"("id") ON DELETE CASCADE,
  "embedding" vector(384),
  "model" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF to_regclass('public.context_embedding') IS NOT NULL THEN
    INSERT INTO "context_chunk" (
      "id", "context_id", "chunk_index", "content", "start_char", "end_char", "character_count"
    )
    SELECT "context_id", "context_id", 0, "source_text", 0,
      char_length("source_text"), char_length("source_text")
    FROM "context_embedding"
    WHERE "embedding" IS NOT NULL
    ON CONFLICT ("id") DO NOTHING;

    INSERT INTO "context_chunk_embedding" ("chunk_id", "embedding", "model")
    SELECT "context_id", "embedding", 'legacy'
    FROM "context_embedding"
    WHERE "embedding" IS NOT NULL
    ON CONFLICT ("chunk_id") DO NOTHING;

    UPDATE "context_item" AS item
    SET "chunk_count" = 1,
        "embedding_status" = 'completed',
        "embedding_updated_at" = now(),
        "embedding_error" = NULL
    WHERE EXISTS (
      SELECT 1 FROM "context_embedding" AS old
      WHERE old."context_id" = item."id"
        AND old."embedding" IS NOT NULL
    );

    DROP TABLE "context_embedding";
  END IF;
END $$;
