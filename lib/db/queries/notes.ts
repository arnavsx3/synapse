import { db } from "../client";
import { and, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { notes } from "../schema";
import { eq } from "drizzle-orm";

type CreateNote = InferInsertModel<typeof notes>;

export const createNote = async (data: CreateNote) => {
  return await db.insert(notes).values(data).returning();
};

export const getNotesByUser = async (userId: string) => {
  return await db.select().from(notes).where(eq(notes.userId, userId));
};

export const updateNote = async (
  id: string,
  data: Partial<{ title: string; content: string }>,
  userId: string,
) => {
  return await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
};

export const deleteNote = async (id: string, userId: string) => {
  return await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
};
