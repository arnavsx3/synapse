import { and, asc, desc, eq, InferInsertModel } from "drizzle-orm";
import { db } from "../client";
import { chats, chatMessages } from "../schema";

type CreateChat = InferInsertModel<typeof chats>;
type CreateChatMessage = InferInsertModel<typeof chatMessages>;

export const createChat = async (data: CreateChat) => {
  const [chat] = await db.insert(chats).values(data).returning();
  return chat;
};

export const getChatsByUser = async (_scopeId: string) =>
  db.select().from(chats).orderBy(desc(chats.updatedAt), desc(chats.createdAt));

export const getChatsByWorkspace = async (workspaceId: string) =>
  db.select().from(chats).where(eq(chats.workspaceId, workspaceId)).orderBy(desc(chats.updatedAt), desc(chats.createdAt));

export const getChatByUser = async (id: string, _scopeId: string) => {
  const [chat] = await db.select().from(chats).where(eq(chats.id, id));
  return chat;
};

export const getChatByWorkspace = async (id: string, workspaceId: string) => {
  const [chat] = await db.select().from(chats).where(and(eq(chats.id, id), eq(chats.workspaceId, workspaceId)));
  return chat;
};

export const getChatMessagesByUser = async (chatId: string, scopeId: string) => {
  const chat = await getChatByUser(chatId, scopeId);
  if (!chat) return null;
  return db.select().from(chatMessages).where(eq(chatMessages.chatId, chatId)).orderBy(asc(chatMessages.createdAt));
};

export const getChatMessagesByWorkspace = async (
  chatId: string,
  workspaceId: string,
) => {
  const chat = await getChatByWorkspace(chatId, workspaceId);
  if (!chat) return null;
  return db.select().from(chatMessages).where(eq(chatMessages.chatId, chatId)).orderBy(asc(chatMessages.createdAt));
};

export const addChatMessage = async (data: CreateChatMessage) => {
  const [message] = await db.insert(chatMessages).values(data).returning();
  return message;
};

export const updateChatTitle = async (id: string, title: string, _scopeId: string) => {
  const [chat] = await db.update(chats).set({ title, updatedAt: new Date() }).where(eq(chats.id, id)).returning();
  return chat;
};

export const updateChatTitleInWorkspace = async (
  id: string,
  title: string,
  workspaceId: string,
) => {
  const [chat] = await db.update(chats).set({ title, updatedAt: new Date() }).where(and(eq(chats.id, id), eq(chats.workspaceId, workspaceId))).returning();
  return chat;
};

export const touchChat = async (id: string, _scopeId: string) => {
  const [chat] = await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, id)).returning();
  return chat;
};

export const touchChatInWorkspace = async (id: string, workspaceId: string) => {
  const [chat] = await db.update(chats).set({ updatedAt: new Date() }).where(and(eq(chats.id, id), eq(chats.workspaceId, workspaceId))).returning();
  return chat;
};

export const deleteChat = async (id: string, _scopeId: string) => {
  const [chat] = await db.delete(chats).where(eq(chats.id, id)).returning();
  return chat;
};

export const deleteChatInWorkspace = async (id: string, workspaceId: string) => {
  const [chat] = await db.delete(chats).where(and(eq(chats.id, id), eq(chats.workspaceId, workspaceId))).returning();
  return chat;
};
