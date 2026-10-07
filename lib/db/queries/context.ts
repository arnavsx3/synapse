import { desc, eq, InferInsertModel } from "drizzle-orm";
import { getDb } from "../client";
import { contextChunks, contextItems } from "../schema";
import type { ContextChunk } from "@/lib/rag/chunking";
import type { EmbeddingStatus } from "@/lib/rag/config";

export type ContextItem = typeof contextItems.$inferSelect;
export type CreateContextItem = InferInsertModel<typeof contextItems>;

export async function listContextItems() {
  const db = getDb();
  return db
    .select({
      id: contextItems.id,
      name: contextItems.name,
      sourceType: contextItems.sourceType,
      characterCount: contextItems.characterCount,
      chunkCount: contextItems.chunkCount,
      embeddingStatus: contextItems.embeddingStatus,
      embeddingError: contextItems.embeddingError,
      embeddingUpdatedAt: contextItems.embeddingUpdatedAt,
      createdAt: contextItems.createdAt,
    })
    .from(contextItems)
    .orderBy(desc(contextItems.createdAt));
}

export async function getContextItem(id: string) {
  const db = getDb();
  const [item] = await db
    .select()
    .from(contextItems)
    .where(eq(contextItems.id, id));
  return item;
}

export async function createContextItem(data: CreateContextItem) {
  const db = getDb();
  const [item] = await db.insert(contextItems).values(data).returning();
  return item;
}

export async function deleteContextItem(id: string) {
  const db = getDb();
  const [item] = await db
    .delete(contextItems)
    .where(eq(contextItems.id, id))
    .returning();
  return item;
}

export async function getAllContextItems() {
  const db = getDb();
  return db.select().from(contextItems).orderBy(desc(contextItems.createdAt));
}

export async function updateContextEmbeddingStatus(
  id: string,
  status: EmbeddingStatus,
  error: string | null = null,
) {
  const db = getDb();
  await db
    .update(contextItems)
    .set({
      embeddingStatus: status,
      embeddingError: error,
      embeddingUpdatedAt: new Date(),
    })
    .where(eq(contextItems.id, id));
}

export async function replaceContextChunks(
  contextId: string,
  chunks: ContextChunk[],
) {
  const db = getDb();
  await db.delete(contextChunks).where(eq(contextChunks.contextId, contextId));

  if (chunks.length > 0) {
    await db.insert(contextChunks).values(
      chunks.map((chunk) => ({
        contextId,
        chunkIndex: chunk.index,
        content: chunk.content,
        startChar: chunk.startChar,
        endChar: chunk.endChar,
        characterCount: chunk.characterCount,
      })),
    );
  }

  await db
    .update(contextItems)
    .set({ chunkCount: chunks.length })
    .where(eq(contextItems.id, contextId));
}

export async function listContextChunks(contextId: string) {
  const db = getDb();
  return db
    .select()
    .from(contextChunks)
    .where(eq(contextChunks.contextId, contextId))
    .orderBy(contextChunks.chunkIndex);
}

export async function listAllContextChunks() {
  const db = getDb();
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
    })
    .from(contextChunks)
    .innerJoin(contextItems, eq(contextChunks.contextId, contextItems.id))
    .orderBy(contextChunks.contextId, contextChunks.chunkIndex);
}
