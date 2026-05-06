import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createProject,
  deleteProjectInWorkspace,
  getProjectsByWorkspace,
  updateProjectInWorkspace,
} from "@/lib/db/queries/projects";
import {
  createProjectSchema,
  deleteProjectSchema,
  updateProjectSchema,
} from "@/lib/validators/projects";
import { getAuthorizedWorkspace } from "@/lib/workspaces/access";
import { emitProjectChanged } from "@/lib/realtime/emitter";

export async function GET(
  _req: NextRequest,
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

    const projects = await getProjectsByWorkspace(
      session.user.id,
      workspaceAccess.workspace.id,
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Get workspace projects error:", error);

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
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid project payload" },
        { status: 400 },
      );
    }

    const project = await createProject({
      ...result.data,
      userId: session.user.id,
      workspaceId: workspaceAccess.workspace.id,
    });

    emitProjectChanged(session.user.id, {
      action: "created",
      workspaceId: workspaceAccess.workspace.id,
      projectId: project.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create workspace project error:", error);

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
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid project payload" },
        { status: 400 },
      );
    }

    const { id, ...data } = result.data;
    const project = await updateProjectInWorkspace(
      id,
      data,
      session.user.id,
      workspaceAccess.workspace.id,
    );

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    emitProjectChanged(session.user.id, {
      action: "updated",
      workspaceId: workspaceAccess.workspace.id,
      projectId: project.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Update workspace project error:", error);

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
    const result = deleteProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid project payload" },
        { status: 400 },
      );
    }

    const project = await deleteProjectInWorkspace(
      result.data.id,
      session.user.id,
      workspaceAccess.workspace.id,
    );

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    emitProjectChanged(session.user.id, {
      action: "deleted",
      workspaceId: workspaceAccess.workspace.id,
      projectId: project.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Delete workspace project error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
