import { and, eq, sql } from "drizzle-orm";
import { getDb } from "../client";
import { contextEmbeddings, contextItems } from "../schema";

const toVectorLiteral = (values: number[]) => `[${values.join(",")}]`;

export async function upsertContextEmbedding(data: {
  contextId: string;
  embedding: number[];
  sourceText: string;
}) {
  const db = getDb();
  const embeddingSql = sql.raw(`'${toVectorLiteral(data.embedding)}'::vector`);

  await db
    .insert(contextEmbeddings)
    .values({
      contextId: data.contextId,
      embedding: embeddingSql,
      sourceText: data.sourceText,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: contextEmbeddings.contextId,
      set: {
        embedding: embeddingSql,
        sourceText: data.sourceText,
        updatedAt: new Date(),
      },
    });
}

export async function getRelevantContextItems(
  queryEmbedding: number[],
  limit = 6,
) {
  const db = getDb();
  const queryVectorSql = sql.raw(`'${toVectorLiteral(queryEmbedding)}'::vector`);
  const similarity = sql<number>`1 - (${contextEmbeddings.embedding} <=> ${queryVectorSql})`;

  return db
    .select({
      id: contextItems.id,
      name: contextItems.name,
      content: contextItems.content,
      sourceType: contextItems.sourceType,
      similarity,
    })
    .from(contextEmbeddings)
    .innerJoin(contextItems, eq(contextEmbeddings.contextId, contextItems.id))
    .where(and(sql`${contextEmbeddings.embedding} is not null`))
    .orderBy(sql`${similarity} desc`)
    .limit(limit);
}
