import { and, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { noteEmbeddings, notes, projects } from "../schema";

const toVectorLiteral = (values: number[]) => {
  return `[${values.join(",")}]`;
};

export const upsertNoteEmbedding = async (data: {
  noteId: string;
  userId: string;
  embedding: number[];
  sourceText: string;
}) => {
  const embeddingSql = sql.raw(`'${toVectorLiteral(data.embedding)}'::vector`);

  await db
    .insert(noteEmbeddings)
    .values({
      noteId: data.noteId,
      userId: data.userId,
      embedding: embeddingSql,
      sourceText: data.sourceText,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: noteEmbeddings.noteId,
      set: {
        embedding: embeddingSql,
        sourceText: data.sourceText,
        updatedAt: new Date(),
      },
    });
};

export const deleteNoteEmbeddingByNoteId = async (
  noteId: string,
  userId: string,
) => {
  const [deleted] = await db
    .delete(noteEmbeddings)
    .where(
      and(eq(noteEmbeddings.noteId, noteId), eq(noteEmbeddings.userId, userId)),
    )
    .returning();

  return deleted;
};

export const getSemanticRelevantNotesByUser = async (
  userId: string,
  queryEmbedding: number[],
  limit = 5,
) => {
  const queryVectorSql = sql.raw(
    `'${toVectorLiteral(queryEmbedding)}'::vector`,
  );
  const similarity = sql<number>`
    1 - (${noteEmbeddings.embedding} <=> ${queryVectorSql})
  `;

  return await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      projectId: notes.projectId,
      projectName: projects.name,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
      sourceText: noteEmbeddings.sourceText,
      similarity,
    })
    .from(noteEmbeddings)
    .innerJoin(notes, eq(noteEmbeddings.noteId, notes.id))
    .leftJoin(projects, eq(notes.projectId, projects.id))
    .where(eq(noteEmbeddings.userId, userId))
    .orderBy(sql`${similarity} desc`)
    .limit(limit);
};
