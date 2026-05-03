import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createProject,
  deleteProject,
  getProjectsByUser,
  updateProject,
} from "@/lib/db/queries/projects";
import {
  createProjectSchema,
  deleteProjectSchema,
  updateProjectSchema,
} from "@/lib/validators/projects";
import { emitProjectChanged } from "@/lib/realtime/emitter";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }

    const project = await createProject({
      ...result.data,
      userId: session.user.id,
    });

    emitProjectChanged(session.user.id, {
      action: "created",
      projectId: project.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const projects = await getProjectsByUser(session.user.id);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);

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
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }

    const { id, ...data } = result.data;
    const project = await updateProject(id, data, session.user.id);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    emitProjectChanged(session.user.id, {
      action: "updated",
      projectId: project.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Update project error:", error);

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
    const result = deleteProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 },
      );
    }

    const project = await deleteProject(result.data.id, session.user.id);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 },
      );
    }

    emitProjectChanged(session.user.id, {
      action: "deleted",
      projectId: project.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Delete project error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}