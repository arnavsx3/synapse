import { asc, InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { chatMessages } from "../schema";

type CreateChatMessage = InferInsertModel<typeof chatMessages>;

export async function listChatMessages() {
  return db
    .select()
    .from(chatMessages)
    .orderBy(asc(chatMessages.createdAt));
}

export async function createChatMessage(data: CreateChatMessage) {
  const [message] = await db.insert(chatMessages).values(data).returning();
  return message;
}

export async function clearChatMessages() {
  await db.delete(chatMessages);
}
