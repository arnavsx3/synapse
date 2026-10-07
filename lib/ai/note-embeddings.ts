import { eq } from "drizzle-orm";
import { buildNoteEmbeddingText } from "./notes";
import { embedText } from "./embeddings";
import { db } from "@/lib/db/client";
import { notes, projects } from "@/lib/db/schema";
import { upsertNoteEmbedding } from "@/lib/db/queries/note-embeddings";

export async function syncNoteEmbeddingByNoteId(
  noteId: string,
) {
  const [note] = await db
    .select({
      id: notes.id,
      title: notes.title,
      content: notes.content,
      workspaceId: notes.workspaceId,
      projectName: projects.name,
    })
    .from(notes)
    .leftJoin(projects, eq(notes.projectId, projects.id))
    .where(eq(notes.id, noteId));

  if (!note) {
    return null;
  }

  const sourceText = buildNoteEmbeddingText({
    title: note.title,
    content: note.content,
    projectName: note.projectName,
  });

  const embedding = await embedText(sourceText);

  await upsertNoteEmbedding({
    noteId: note.id,
    workspaceId: note.workspaceId,
    embedding,
    sourceText,
  });

  return {
    noteId: note.id,
    sourceText,
  };
}
