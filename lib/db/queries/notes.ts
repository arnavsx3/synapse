import {
  and,
  desc,
  eq,
  ilike,
  InferInsertModel,
  isNull,
  or,
} from "drizzle-orm";
import { db } from "../client";
import { notes } from "../schema";

type CreateNote = InferInsertModel<typeof notes>;
type UpdateNote = Partial<Pick<CreateNote, "title" | "content" | "projectId">>;

const buildQueryTerms = (query: string) => {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length >= 3),
    ),
  ).slice(0, 60);
};

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

export const getRelevantNotesByUser = async (
  userId: string,
  query: string,
  limit = 5,
) => {
  const terms = buildQueryTerms(query);

  if (terms.length === 0) {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt), desc(notes.createdAt))
      .limit(limit);
  }

  const conditions = terms.flatMap((term) => [
    ilike(notes.title, `%${term}%`),
    ilike(notes.content, `%${term}%`),
  ]);

  const matchedNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), or(...conditions)))
    .orderBy(desc(notes.updatedAt), desc(notes.createdAt))
    .limit(limit);

  if (matchedNotes.length > 0) {
    return matchedNotes;
  }

  return await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt), desc(notes.createdAt))
    .limit(limit);
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
