import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../client";
import { contextChunks, contextEmbeddings, contextItems } from "../schema";

const toVectorLiteral = (values: number[]) => {
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding contains a non-finite value.");
  }

  return `[${values.join(",")}]`;
};

export async function upsertContextChunkEmbedding(data: {
  chunkId: string;
  embedding: number[];
  model: string;
}) {
  const db = getDb();
  const embeddingSql = sql.raw(`'${toVectorLiteral(data.embedding)}'::vector`);

  await db
    .insert(contextEmbeddings)
    .values({
      chunkId: data.chunkId,
      embedding: embeddingSql,
      model: data.model,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: contextEmbeddings.chunkId,
      set: {
        embedding: embeddingSql,
        model: data.model,
        updatedAt: new Date(),
      },
    });
}

export async function getRelevantContextChunks(
  queryEmbedding: number[],
  limit = 8,
  minimumSimilarity = 0.2,
) {
  const db = getDb();
  const queryVectorSql = sql.raw(`'${toVectorLiteral(queryEmbedding)}'::vector`);
  const similarity = sql<number>`1 - (${contextEmbeddings.embedding} <=> ${queryVectorSql})`;

  return db
    .select({
      id: contextChunks.id,
      contextId: contextItems.id,
      name: contextItems.name,
      sourceType: contextItems.sourceType,
      content: contextChunks.content,
      chunkIndex: contextChunks.chunkIndex,
      startChar: contextChunks.startChar,
      endChar: contextChunks.endChar,
      similarity,
    })
    .from(contextEmbeddings)
    .innerJoin(contextChunks, eq(contextEmbeddings.chunkId, contextChunks.id))
    .innerJoin(contextItems, eq(contextChunks.contextId, contextItems.id))
    .where(sql`${similarity} >= ${minimumSimilarity}`)
    .orderBy(desc(similarity))
    .limit(limit);
}
