import { NextResponse } from "next/server";
import { deleteContextItem } from "@/lib/db/queries/context";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const deleted = await deleteContextItem(id);

  if (!deleted) {
    return NextResponse.json({ message: "Context not found." }, { status: 404 });
  }

  return NextResponse.json({ context: deleted });
}
