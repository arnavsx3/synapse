import { NextResponse } from "next/server";
import { getNotes } from "@/lib/db/queries/notes";
import { enqueueNoteEmbeddingJob } from "@/lib/queue/note-embedding";

export async function POST() {
  try {
    const notes = await getNotes();

    let queuedCount = 0;
    let failedCount = 0;

    for (const note of notes) {
      try {
        await enqueueNoteEmbeddingJob({
          noteId: note.id,
        });
        queuedCount += 1;
      } catch (error) {
        failedCount += 1;
        console.error(`Backfill queue failed for note ${note.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Backfill jobs queued",
      total: notes.length,
      queuedCount,
      failedCount,
    });
  } catch (error) {
    console.error("Embedding backfill queue error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
