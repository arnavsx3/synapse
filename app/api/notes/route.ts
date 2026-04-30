import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

import {
  createNote,
  getNotesByUser,
  updateNote,
  deleteNote,
} from "@/lib/db/queries/notes";
import {
  createNoteSchema,
  updateNoteSchema,
  deleteNoteSchema,
} from "@/lib/validators/notes";

import { z } from "zod";
import { getProjectByUser } from "@/lib/db/queries/projects";
import { enqueueNoteEmbeddingJob } from "@/lib/queue/note-embedding";

const noteProjectFilterSchema = z
  .union([z.literal("inbox"), z.uuid()])
  .nullable();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }

    if (result.data.projectId) {
      const project = await getProjectByUser(
        result.data.projectId,
        session.user.id,
      );

      if (!project) {
        return NextResponse.json(
          { message: "Project not found" },
          { status: 404 },
        );
      }
    }

    const note = await createNote({
      ...result.data,
      userId: session.user.id,
    });

    try {
      await enqueueNoteEmbeddingJob({
        noteId: note.id,
        userId: session.user.id,
      });
    } catch (queueError) {
      console.error("Create note embedding queue error:", queueError);
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Create note error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const projectIdResult = noteProjectFilterSchema.safeParse(
      req.nextUrl.searchParams.get("projectId"),
    );

    if (!projectIdResult.success) {
      return NextResponse.json(
        { message: "Invalid project filter" },
        { status: 400 },
      );
    }

    const notes = await getNotesByUser(session.user.id, projectIdResult.data);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Get note error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }

    const { id, ...data } = result.data;
    if (data.projectId) {
      const project = await getProjectByUser(data.projectId, session.user.id);

      if (!project) {
        return NextResponse.json(
          { message: "Project not found" },
          { status: 404 },
        );
      }
    }
    const updated = await updateNote(id, data, session.user.id);
    if (!updated) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    try {
      await enqueueNoteEmbeddingJob({
        noteId: updated.id,
        userId: session.user.id,
      });
    } catch (queueError) {
      console.error("Update note embedding queue error:", queueError);
    }

    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error("Update note error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = deleteNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }
    const deleted = await deleteNote(result.data.id, session.user.id);
    if (!deleted) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ note: deleted });
  } catch (error) {
    console.error("Delete note error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
