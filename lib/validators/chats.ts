import z from "zod";

export const createChatSchema = z.object({
  title: z.string().min(1).max(120).optional(),
});

export const chatParamsSchema = z.object({
  chatId: z.uuid(),
});

export const sendChatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
});