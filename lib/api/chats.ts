import { api } from "./client";

export type Chat = {
  id: string;
  title: string;
  userId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string | null;
};

type CreateChatInput = {
  title?: string;
};

type UpdateChatInput = {
  id: string;
  title: string;
};

type SendChatMessageInput = {
  message: string;
};

type SendChatMessageResponse = {
  reply: string;
  assistantMessage: ChatMessage;
};

export const getChats = async () => {
  const response = await api.get<{ chats: Chat[] }>("/chats");
  return response.data.chats;
};

export const createChat = async (data: CreateChatInput = {}) => {
  const response = await api.post<{ chat: Chat }>("/chats", data);
  return response.data.chat;
};

export const updateChat = async (data: UpdateChatInput) => {
  const response = await api.patch<{ chat: Chat }>("/chats", data);
  return response.data.chat;
};

export const deleteChat = async (id: string) => {
  const response = await api.delete<{ chat: Chat }>("/chats", {
    data: { id },
  });

  return response.data.chat;
};

export const getChatMessages = async (chatId: string) => {
  const response = await api.get<{ messages: ChatMessage[] }>(
    `/chats/${chatId}/messages`,
  );

  return response.data.messages;
};

export const sendChatMessage = async (
  chatId: string,
  data: SendChatMessageInput,
) => {
  const response = await api.post<SendChatMessageResponse>(
    `/chats/${chatId}/messages`,
    data,
  );

  return response.data;
};
