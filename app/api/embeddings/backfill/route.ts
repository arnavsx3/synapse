import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app-context";
import { getNotesByUser } from "@/lib/db/queries/notes";
import { enqueueNoteEmbeddingJob } from "@/lib/queue/note-embedding";

export async function POST() {
  try {
    const session = await getAppContext();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const notes = await getNotesByUser(session.user.id);

    let queuedCount = 0;
    let failedCount = 0;

    for (const note of notes) {
      try {
        await enqueueNoteEmbeddingJob({
          noteId: note.id,
          userId: session.user.id,
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
