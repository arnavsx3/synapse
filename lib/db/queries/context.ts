import { desc, eq, InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { contextItems } from "../schema";

export type ContextItem = typeof contextItems.$inferSelect;
export type CreateContextItem = InferInsertModel<typeof contextItems>;

export async function listContextItems() {
  return db
    .select({
      id: contextItems.id,
      name: contextItems.name,
      sourceType: contextItems.sourceType,
      characterCount: contextItems.characterCount,
      createdAt: contextItems.createdAt,
    })
    .from(contextItems)
    .orderBy(desc(contextItems.createdAt));
}

export async function getContextItem(id: string) {
  const [item] = await db
    .select()
    .from(contextItems)
    .where(eq(contextItems.id, id));
  return item;
}

export async function createContextItem(data: CreateContextItem) {
  const [item] = await db.insert(contextItems).values(data).returning();
  return item;
}

export async function deleteContextItem(id: string) {
  const [item] = await db
    .delete(contextItems)
    .where(eq(contextItems.id, id))
    .returning();
  return item;
}

export async function getAllContextItems() {
  return db.select().from(contextItems).orderBy(desc(contextItems.createdAt));
}
