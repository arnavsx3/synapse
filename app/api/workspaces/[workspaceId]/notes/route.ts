import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createNote,
  deleteNoteInWorkspace,
  getNotesByWorkspace,
  updateNoteInWorkspace,
} from "@/lib/db/queries/notes";
import {
  createNoteSchema,
  updateNoteSchema,
  deleteNoteSchema,
} from "@/lib/validators/notes";
import { z } from "zod";
import { getProjectByWorkspace } from "@/lib/db/queries/projects";
import { enqueueNoteEmbeddingJob } from "@/lib/queue/note-embedding";
import { emitNoteChanged } from "@/lib/realtime/emitter";
import { getAuthorizedWorkspace } from "@/lib/workspaces/access";

const noteProjectFilterSchema = z
  .union([z.literal("inbox"), z.uuid()])
  .nullable();

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const workspaceAccess = await getAuthorizedWorkspace(
      context.params,
      session.user.id,
    );

    if (workspaceAccess.error === "invalid") {
      return NextResponse.json(
        { message: "Invalid workspace id" },
        { status: 400 },
      );
    }

    if (workspaceAccess.error === "not_found") {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 },
      );
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

    if (projectIdResult.data && projectIdResult.data !== "inbox") {
      const project = await getProjectByWorkspace(
        projectIdResult.data,
        session.user.id,
        workspaceAccess.workspace.id,
      );
      if (!project) {
        return NextResponse.json(
          { message: "Project not found" },
          { status: 404 },
        );
      }
    }

    const notes = await getNotesByWorkspace(
      session.user.id,
      workspaceAccess.workspace.id,
      projectIdResult.data,
    );

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Get workspace notes error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const workspaceAccess = await getAuthorizedWorkspace(
      context.params,
      session.user.id,
    );

    if (workspaceAccess.error === "invalid") {
      return NextResponse.json(
        { message: "Invalid workspace id" },
        { status: 400 },
      );
    }

    if (workspaceAccess.error === "not_found") {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 },
      );
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
      const project = await getProjectByWorkspace(
        result.data.projectId,
        session.user.id,
        workspaceAccess.workspace.id,
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
      workspaceId: workspaceAccess.workspace.id,
    });

    try {
      await enqueueNoteEmbeddingJob({
        noteId: note.id,
        userId: session.user.id,
      });
    } catch (queueError) {
      console.error("Create note embedding queue error:", queueError);
    }

    emitNoteChanged(session.user.id, {
      action: "created",
      workspaceId: workspaceAccess.workspace.id,
      noteId: note.id,
      projectId: note.projectId ?? null,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Create workspace note error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const workspaceAccess = await getAuthorizedWorkspace(
      context.params,
      session.user.id,
    );

    if (workspaceAccess.error === "invalid") {
      return NextResponse.json(
        { message: "Invalid workspace id" },
        { status: 400 },
      );
    }

    if (workspaceAccess.error === "not_found") {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 },
      );
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
      const project = await getProjectByWorkspace(
        data.projectId,
        session.user.id,
        workspaceAccess.workspace.id,
      );

      if (!project) {
        return NextResponse.json(
          { message: "Project not found" },
          { status: 404 },
        );
      }
    }

    const updated = await updateNoteInWorkspace(
      id,
      data,
      session.user.id,
      workspaceAccess.workspace.id,
    );

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

    emitNoteChanged(session.user.id, {
      action: "updated",
      workspaceId: workspaceAccess.workspace.id,
      noteId: updated.id,
      projectId: updated.projectId ?? null,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error("Update workspace note error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const workspaceAccess = await getAuthorizedWorkspace(
      context.params,
      session.user.id,
    );

    if (workspaceAccess.error === "invalid") {
      return NextResponse.json(
        { message: "Invalid workspace id" },
        { status: 400 },
      );
    }

    if (workspaceAccess.error === "not_found") {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const result = deleteNoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }

    const deleted = await deleteNoteInWorkspace(
      result.data.id,
      session.user.id,
      workspaceAccess.workspace.id,
    );

    if (!deleted) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    emitNoteChanged(session.user.id, {
      action: "deleted",
      workspaceId: workspaceAccess.workspace.id,
      noteId: deleted.id,
      projectId: deleted.projectId ?? null,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ note: deleted });
  } catch (error) {
    console.error("Delete workspace note error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}