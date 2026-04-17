import { NextRequest, NextResponse } from "next/server";
import { createNote, getNotesByUser } from "@/lib/db/queries/notes";
import { createNoteSchema } from "@/lib/validators/notes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }
    const note = await createNote(result.data);
    return NextResponse.json({ message: "Notes created", note: note });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    const notes = await getNotesByUser(userId);
    return NextResponse.json({ message: "Notes fethed", notes: notes });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
