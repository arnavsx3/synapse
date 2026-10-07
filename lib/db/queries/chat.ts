import { asc, InferInsertModel } from "drizzle-orm";
import { getDb } from "../client";
import { chatMessages } from "../schema";

type CreateChatMessage = InferInsertModel<typeof chatMessages>;

export async function listChatMessages() {
  const db = getDb();
  return db
    .select()
    .from(chatMessages)
    .orderBy(asc(chatMessages.createdAt));
}

export async function createChatMessage(data: CreateChatMessage) {
  const db = getDb();
  const [message] = await db.insert(chatMessages).values(data).returning();
  return message;
}

export async function clearChatMessages() {
  const db = getDb();
  await db.delete(chatMessages);
}
