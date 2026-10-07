import { NextRequest, NextResponse } from "next/server";
import {
  createWorkspace,
  listWorkspaces,
} from "@/lib/db/queries/workspaces";
import { createWorkspaceSchema } from "@/lib/validators/workspaces";
import { emitWorkspaceChanged } from "@/lib/realtime/emitter";

export async function GET() {
  try {
    const workspaces = await listWorkspaces();
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createWorkspaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid workspace payload" },
        { status: 400 },
      );
    }

    const workspace = await createWorkspace({
      name: result.data.name,
    });

    emitWorkspaceChanged({
      action: "created",
      workspaceId: workspace.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error("Create workspace error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
