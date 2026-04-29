import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNotesByUser } from "@/lib/db/queries/notes";
import { syncNoteEmbeddingByNoteId } from "@/lib/ai/note-embeddings";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notes = await getNotesByUser(session.user.id);

    let successCount = 0;
    let failedCount = 0;

    for (const note of notes) {
      try {
        await syncNoteEmbeddingByNoteId(note.id, session.user.id);
        successCount += 1;
      } catch (error) {
        failedCount += 1;
        console.error(`Backfill failed for note ${note.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Backfill completed",
      total: notes.length,
      successCount,
      failedCount,
    });
  } catch (error) {
    console.error("Embedding backfill error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
