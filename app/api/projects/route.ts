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

