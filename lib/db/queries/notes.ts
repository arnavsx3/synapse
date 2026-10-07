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
  _scopeId: string,
  projectId?: NotesProjectFilter,
) => {
  if (projectId === "inbox") {
    return db.select().from(notes).where(isNull(notes.projectId)).orderBy(desc(notes.updatedAt), desc(notes.createdAt));
  }
  if (projectId) {
    return db.select().from(notes).where(eq(notes.projectId, projectId)).orderBy(desc(notes.updatedAt), desc(notes.createdAt));
  }
  return db.select().from(notes).orderBy(desc(notes.updatedAt), desc(notes.createdAt));
};

export const getNotesByWorkspace = async (
  workspaceId: string,
  projectId?: NotesProjectFilter,
) => {
  const workspaceFilter = eq(notes.workspaceId, workspaceId);
  if (projectId === "inbox") {
    return db.select().from(notes).where(and(workspaceFilter, isNull(notes.projectId))).orderBy(desc(notes.updatedAt), desc(notes.createdAt));
  }
  if (projectId) {
    return db.select().from(notes).where(and(workspaceFilter, eq(notes.projectId, projectId))).orderBy(desc(notes.updatedAt), desc(notes.createdAt));
  }
  return db.select().from(notes).where(workspaceFilter).orderBy(desc(notes.updatedAt), desc(notes.createdAt));
};

export const updateNote = async (id: string, data: UpdateNote, _scopeId: string) => {
  const [note] = await db.update(notes).set({ ...data, updatedAt: new Date() }).where(eq(notes.id, id)).returning();
  return note;
};

export const updateNoteInWorkspace = async (
  id: string,
  data: UpdateNote,
  workspaceId: string,
) => {
  const [note] = await db.update(notes).set({ ...data, updatedAt: new Date() }).where(and(eq(notes.id, id), eq(notes.workspaceId, workspaceId))).returning();
  return note;
};

export const deleteNote = async (id: string, _scopeId: string) => {
  const [note] = await db.delete(notes).where(eq(notes.id, id)).returning();
  return note;
};

export const deleteNoteInWorkspace = async (
  id: string,
  workspaceId: string,
) => {
  const [note] = await db.delete(notes).where(and(eq(notes.id, id), eq(notes.workspaceId, workspaceId))).returning();
  return note;
};
