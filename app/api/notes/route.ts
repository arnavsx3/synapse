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

    const note = await createNote({
      ...result.data,
      userId: session.user.id,
    });

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

    const projectId = req.nextUrl.searchParams.get("projectId");
    const notes = await getNotesByUser(session.user.id,projectId);
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
    const updated = await updateNote(id, data, session.user.id);
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
    return NextResponse.json({ note: deleted });
  } catch (error) {
    console.error("Delete note error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
