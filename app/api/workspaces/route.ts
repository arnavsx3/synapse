import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createWorkspace,
  listWorkspacesByOwner,
} from "@/lib/db/queries/workspaces";
import { createWorkspaceSchema } from "@/lib/validators/workspaces";
import { emitWorkspaceChanged } from "@/lib/realtime/emitter";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const workspaces = await listWorkspacesByOwner(session.user.id);
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
      ownerUserId: session.user.id,
    });

    emitWorkspaceChanged(session.user.id, {
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
