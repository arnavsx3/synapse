import { db } from "../client";
import { and, InferInsertModel, isNull, eq } from "drizzle-orm";
import { notes } from "../schema";

type CreateNote = InferInsertModel<typeof notes>;
type UpdateNote = Partial<Pick<CreateNote, "title" | "content" | "projectId">>;

export const createNote = async (data: CreateNote) => {
  const [note] = await db.insert(notes).values(data).returning();
  return note;
};

export const getNotesByUser = async (
  userId: string,
  projectId?: string | null,
) => {
  if (projectId === "inbox") {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.projectId)));
  }

  if (projectId) {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.projectId, projectId)));
  }

  return await db.select().from(notes).where(eq(notes.userId, userId));
};

export const updateNote = async (
  id: string,
  data: UpdateNote,
  userId: string,
) => {
  const [note] = await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();
  return note;
};

export const deleteNote = async (id: string, userId: string) => {
  const [note] = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning();

  return note;
};
