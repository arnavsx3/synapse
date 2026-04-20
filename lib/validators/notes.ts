import z from "zod";

export const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  projectId: z.string().uuid().nullable().optional(),
});

export const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  projectId: z.string().uuid().nullable().optional(),
});

export const deleteNoteSchema = z.object({
  id: z.string().uuid(),
});
