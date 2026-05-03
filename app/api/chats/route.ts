import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createChat,
  deleteChat,
  getChatsByUser,
  updateChatTitle,
} from "@/lib/db/queries/chats";
import {
  createChatSchema,
  deleteChatSchema,
  updateChatSchema,
} from "@/lib/validators/chats";
import { emitChatChanged } from "@/lib/realtime/emitter";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const chats = await getChatsByUser(session.user.id);
    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Get chats error:", error);

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
    const result = createChatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const chat = await createChat({
      userId: session.user.id,
      title: result.data.title?.trim() || "New Chat",
    });

    emitChatChanged(session.user.id, {
      action: "created",
      chatId: chat.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    console.error("Create chat error:", error);

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
    const result = updateChatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const chat = await updateChatTitle(
      result.data.id,
      result.data.title,
      session.user.id,
    );

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    emitChatChanged(session.user.id, {
      action: "updated",
      chatId: chat.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Update chat error:", error);

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
    const result = deleteChatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const chat = await deleteChat(result.data.id, session.user.id);

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    emitChatChanged(session.user.id, {
      action: "deleted",
      chatId: chat.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Delete chat error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
