import { api } from "./client";

export type Chat = {
  id: string;
  title: string;
  userId: string;
  workspaceId: string;
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

export const getChats = async (workspaceId: string) => {
  const response = await api.get<{ chats: Chat[] }>(
    `/workspaces/${workspaceId}/chats`,
  );

  return response.data.chats;
};

export const createChat = async (
  workspaceId: string,
  data: CreateChatInput = {},
) => {
  const response = await api.post<{ chat: Chat }>(
    `/workspaces/${workspaceId}/chats`,
    data,
  );

  return response.data.chat;
};

export const updateChat = async (
  workspaceId: string,
  data: UpdateChatInput,
) => {
  const response = await api.patch<{ chat: Chat }>(
    `/workspaces/${workspaceId}/chats`,
    data,
  );

  return response.data.chat;
};

export const deleteChat = async (workspaceId: string, id: string) => {
  const response = await api.delete<{ chat: Chat }>(
    `/workspaces/${workspaceId}/chats`,
    {
      data: { id },
    },
  );

  return response.data.chat;
};

export const getChatMessages = async (workspaceId: string, chatId: string) => {
  const response = await api.get<{ messages: ChatMessage[] }>(
    `/workspaces/${workspaceId}/chats/${chatId}/messages`,
  );

  return response.data.messages;
};

export const sendChatMessage = async (
  workspaceId: string,
  chatId: string,
  data: SendChatMessageInput,
) => {
  const response = await api.post<SendChatMessageResponse>(
    `/workspaces/${workspaceId}/chats/${chatId}/messages`,
    data,
  );

  return response.data;
};
