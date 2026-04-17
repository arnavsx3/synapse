import { db } from "../client";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { notes } from "../schema";
import { eq } from "drizzle-orm";

type CreateNote = InferInsertModel<typeof notes>;
type ReadNote = InferSelectModel<typeof notes>;

export const createNote = async (data: CreateNote) => {
  return await db.insert(notes).values(data).returning();
};

export const getNotesByUser = async (userId: ReadNote["userId"]) => {
  return await db.select().from(notes).where(eq(notes.userId, userId));
};

export const updateNote = async (
  id: string,
  data: Partial<{ title: string; content: string }>,
) => {
  return await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(notes.id, id))
    .returning();
};

export const deleteNote = async (id: string) => {
  return await db.delete(notes).where(eq(notes.id, id)).returning();
};