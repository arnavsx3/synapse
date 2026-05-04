import { and, desc, eq, InferInsertModel, isNull } from "drizzle-orm";
import { db } from "../client";
import { notes } from "../schema";

type CreateNote = InferInsertModel<typeof notes>;
type UpdateNote = Partial<Pick<CreateNote, "title" | "content" | "projectId">>;
type NotesProjectFilter = string | "inbox" | null | undefined;

export const createNote = async (data: CreateNote) => {
  const [note] = await db.insert(notes).values(data).returning();
  return note;
};

export const getNotesByUser = async (
  userId: string,
  projectId?: NotesProjectFilter,
) => {
  if (projectId === "inbox") {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.projectId)))
      .orderBy(desc(notes.updatedAt), desc(notes.createdAt));
  }

  if (projectId) {
    return await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.projectId, projectId)))
      .orderBy(desc(notes.updatedAt), desc(notes.createdAt));
  }

  return await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt), desc(notes.createdAt));
};

export const getNotesByWorkspace = async (
  userId: string,
  workspaceId: string,
  projectId?: NotesProjectFilter,
) => {
  if (projectId === "inbox") {
    return await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.workspaceId, workspaceId),
          isNull(notes.projectId),
        ),
      )
      .orderBy(desc(notes.updatedAt), desc(notes.createdAt));
  }

  if (projectId) {
    return await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          eq(notes.workspaceId, workspaceId),
          eq(notes.projectId, projectId),
        ),
      )
      .orderBy(desc(notes.updatedAt), desc(notes.createdAt));
  }

  return await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.workspaceId, workspaceId)))
    .orderBy(desc(notes.updatedAt), desc(notes.createdAt));
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

export const updateNoteInWorkspace = async (
  id: string,
  data: UpdateNote,
  userId: string,
  workspaceId: string,
) => {
  const [note] = await db
    .update(notes)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(notes.id, id),
        eq(notes.userId, userId),
        eq(notes.workspaceId, workspaceId),
      ),
    )
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

export const deleteNoteInWorkspace = async (
  id: string,
  userId: string,
  workspaceId: string,
) => {
  const [note] = await db
    .delete(notes)
    .where(
      and(
        eq(notes.id, id),
        eq(notes.userId, userId),
        eq(notes.workspaceId, workspaceId),
      ),
    )
    .returning();

  return note;
};
