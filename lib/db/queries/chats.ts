import { and, asc, desc, eq, InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { chats, chatMessages } from "../schema";

type CreateChat = InferInsertModel<typeof chats>;
type CreateChatMessage = InferInsertModel<typeof chatMessages>;

export const createChat = async (data: CreateChat) => {
  const [chat] = await db.insert(chats).values(data).returning();
  return chat;
};

export const getChatsByUser = async (userId: string) => {
  return await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt), desc(chats.createdAt));
};

export const getChatByUser = async (id: string, userId: string) => {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, id), eq(chats.userId, userId)));

  return chat;
};

export const getChatMessagesByUser = async (chatId: string, userId: string) => {
  const chat = await getChatByUser(chatId, userId);

  if (!chat) {
    return null;
  }

  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(asc(chatMessages.createdAt));
};

export const addChatMessage = async (data: CreateChatMessage) => {
  const [message] = await db.insert(chatMessages).values(data).returning();
  return message;
};

export const updateChatTitle = async (
  id: string,
  title: string,
  userId: string,
) => {
  const [chat] = await db
    .update(chats)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(and(eq(chats.id, id), eq(chats.userId, userId)))
    .returning();

  return chat;
};

export const touchChat = async (id: string, userId: string) => {
  const [chat] = await db
    .update(chats)
    .set({
      updatedAt: new Date(),
    })
    .where(and(eq(chats.id, id), eq(chats.userId, userId)))
    .returning();

  return chat;
};

export const deleteChat = async (id: string, userId: string) => {
  const [chat] = await db
    .delete(chats)
    .where(and(eq(chats.id, id), eq(chats.userId, userId)))
    .returning();

  return chat;
};
