import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createChat,
  deleteChatInWorkspace,
  getChatsByWorkspace,
  updateChatTitleInWorkspace,
} from "@/lib/db/queries/chats";
import {
  createChatSchema,
  deleteChatSchema,
  updateChatSchema,
} from "@/lib/validators/chats";
import { getAuthorizedWorkspace } from "@/lib/workspaces/access";
import { emitChatChanged } from "@/lib/realtime/emitter";

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

    const chats = await getChatsByWorkspace(
      session.user.id,
      workspaceAccess.workspace.id,
    );

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Get workspace chats error:", error);

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
    const result = createChatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const chat = await createChat({
      userId: session.user.id,
      workspaceId: workspaceAccess.workspace.id,
      title: result.data.title?.trim() || "New Chat",
    });

    emitChatChanged(session.user.id, {
      action: "created",
      workspaceId: workspaceAccess.workspace.id,
      chatId: chat.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    console.error("Create workspace chat error:", error);

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
    const result = updateChatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const chat = await updateChatTitleInWorkspace(
      result.data.id,
      result.data.title,
      session.user.id,
      workspaceAccess.workspace.id,
    );

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    emitChatChanged(session.user.id, {
      action: "updated",
      workspaceId: workspaceAccess.workspace.id,
      chatId: chat.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Update workspace chat error:", error);

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
    const result = deleteChatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const chat = await deleteChatInWorkspace(
      result.data.id,
      session.user.id,
      workspaceAccess.workspace.id,
    );

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    emitChatChanged(session.user.id, {
      action: "deleted",
      workspaceId: workspaceAccess.workspace.id,
      chatId: chat.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Delete workspace chat error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
