import { NextRequest, NextResponse } from "next/server";
import {
  countWorkspaces,
  deleteWorkspace,
  updateWorkspace,
} from "@/lib/db/queries/workspaces";
import { updateWorkspaceSchema } from "@/lib/validators/workspaces";
import { getAuthorizedWorkspace } from "@/lib/workspaces/access";
import { emitWorkspaceChanged } from "@/lib/realtime/emitter";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const result = await getAuthorizedWorkspace(context.params);

    if (result.error === "invalid") {
      return NextResponse.json(
        { message: "Invalid workspace id" },
        { status: 400 },
      );
    }

    if (result.error === "not_found") {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ workspace: result.workspace });
  } catch (error) {
    console.error("Get workspace error:", error);

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
    const workspaceAccess = await getAuthorizedWorkspace(context.params);

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
    const bodyResult = updateWorkspaceSchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        { message: "Invalid workspace payload" },
        { status: 400 },
      );
    }

    const workspace = await updateWorkspace(
      workspaceAccess.workspace.id,
      { name: bodyResult.data.name },
    );

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 },
      );
    }

    emitWorkspaceChanged({
      action: "updated",
      workspaceId: workspace.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Update workspace error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const workspaceAccess = await getAuthorizedWorkspace(context.params);

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

    const totalWorkspaces = await countWorkspaces();

    if (totalWorkspaces <= 1) {
      return NextResponse.json(
        { message: "You must keep at least one workspace." },
        { status: 400 },
      );
    }

    const workspace = await deleteWorkspace(
      workspaceAccess.workspace.id,
    );

    if (!workspace) {
      return NextResponse.json(
        { message: "Workspace not found" },
        { status: 404 },
      );
    }

    emitWorkspaceChanged({
      action: "deleted",
      workspaceId: workspace.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Delete workspace error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
