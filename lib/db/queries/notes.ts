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
import { notes,projects } from "../schema";

type CreateNote = InferInsertModel<typeof notes>;
type UpdateNote = Partial<Pick<CreateNote, "title" | "content" | "projectId">>;

export type RelevantNote = {
  id: string;
  title: string;
  content: string | null;
  projectId: string | null;
  projectName: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  score: number;
};

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const buildQueryTerms = (query: string) => {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length >= 3),
    ),
  ).slice(0, 20);
};

const countOccurrences = (text: string, term: string) => {
  if (!text || !term) {
    return 0;
  }

  let count = 0;
  let startIndex = 0;

  while (true) {
    const matchIndex = text.indexOf(term, startIndex);
    if (matchIndex === -1) {
      break;
    }

    count += 1;
    startIndex = matchIndex + term.length;
  }

  return count;
};

const scoreNoteAgainstQuery = (
  note: {
    title: string;
    content: string | null;
    projectName: string | null;
    updatedAt: Date | null;
  },
  rawQuery: string,
  terms: string[],
) => {
  const normalizedQuery = normalizeText(rawQuery);
  const title = normalizeText(note.title);
  const content = normalizeText(note.content ?? "");
  const projectName = normalizeText(note.projectName ?? "");

  let score = 0;

  if (normalizedQuery) {
    if (title.includes(normalizedQuery)) {
      score += 18;
    }

    if (projectName && projectName.includes(normalizedQuery)) {
      score += 12;
    }

    if (content.includes(normalizedQuery)) {
      score += 10;
    }
  }

  for (const term of terms) {
    score += countOccurrences(title, term) * 5;
    score += countOccurrences(projectName, term) * 4;
    score += countOccurrences(content, term) * 2;

    if (title.startsWith(term)) {
      score += 2;
    }
  }

  if (note.updatedAt) {
    const ageInDays =
      (Date.now() - note.updatedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 7) {
      score += 2;
    } else if (ageInDays <= 30) {
      score += 1;
    }
  }

  return score;
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
): Promise<RelevantNote[]> => {
  const terms = buildQueryTerms(query);

   if (terms.length === 0) {
     const recentNotes = await db
       .select({
         id: notes.id,
         title: notes.title,
         content: notes.content,
         projectId: notes.projectId,
         projectName: projects.name,
         createdAt: notes.createdAt,
         updatedAt: notes.updatedAt,
       })
       .from(notes)
       .leftJoin(projects, eq(notes.projectId, projects.id))
       .where(eq(notes.userId, userId))
       .orderBy(desc(notes.updatedAt), desc(notes.createdAt))
       .limit(limit);

     return recentNotes.map((note) => ({
       ...note,
       score: 0,
     }));
   }

  const conditions = terms.flatMap((term) => [
    ilike(notes.title, `%${term}%`),
    ilike(notes.content, `%${term}%`),
    ilike(projects.name, `%${term}%`),
  ]);

    const candidateNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        projectId: notes.projectId,
        projectName: projects.name,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .leftJoin(projects, eq(notes.projectId, projects.id))
      .where(and(eq(notes.userId, userId), or(...conditions)))
      .orderBy(desc(notes.updatedAt), desc(notes.createdAt))
      .limit(25);

    const scoredNotes = candidateNotes
      .map((note) => ({
        ...note,
        score: scoreNoteAgainstQuery(note, query, terms),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        const aTime = a.updatedAt?.getTime() ?? 0;
        const bTime = b.updatedAt?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, limit);

    if (scoredNotes.length > 0) {
      return scoredNotes;
    }

  const fallbackNotes = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      projectId: notes.projectId,
      projectName: projects.name,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .leftJoin(projects, eq(notes.projectId, projects.id))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt), desc(notes.createdAt))
    .limit(limit);

  return fallbackNotes.map((note) => ({
    ...note,
    score: 0,
  }));
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
