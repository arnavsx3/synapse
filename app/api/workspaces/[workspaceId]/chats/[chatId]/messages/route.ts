import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  addChatMessage,
  getChatByWorkspace,
  getChatMessagesByWorkspace,
  touchChatInWorkspace,
  updateChatTitleInWorkspace,
} from "@/lib/db/queries/chats";
import { getSemanticRelevantNotesByWorkspace } from "@/lib/db/queries/note-embeddings";
import { embedText } from "@/lib/ai/embeddings";
import {
  chatParamsSchema,
  sendChatMessageSchema,
} from "@/lib/validators/chats";
import axios from "axios";
import {
  emitChatChanged,
  emitChatMessageCreated,
} from "@/lib/realtime/emitter";
import { getAuthorizedWorkspace } from "@/lib/workspaces/access";

const formatRelevantNotes = (
  relevantNotes: Awaited<
    ReturnType<typeof getSemanticRelevantNotesByWorkspace>
  >,
) => {
  if (relevantNotes.length === 0) {
    return "No relevant user notes were found.";
  }

  return relevantNotes
    .map((note, index) => {
      const normalizedContent = (note.content ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 600);

      return [
        `Note ${index + 1}`,
        `Title: ${note.title}`,
        `Project: ${note.projectName ?? "Inbox"}`,
        `Similarity: ${note.similarity.toFixed(4)}`,
        `Content: ${normalizedContent || "Empty note"}`,
      ].join("\n");
    })
    .join("\n\n");
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string; chatId: string }> },
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

    const params = await context.params;
    const chatParamsResult = chatParamsSchema.safeParse(params);

    if (!chatParamsResult.success) {
      return NextResponse.json({ message: "Invalid chat id" }, { status: 400 });
    }

    const messages = await getChatMessagesByWorkspace(
      chatParamsResult.data.chatId,
      session.user.id,
      workspaceAccess.workspace.id,
    );

    if (!messages) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get workspace chat messages error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ workspaceId: string; chatId: string }> },
) {
  let chatId: string | null = null;
  let sessionUserId: string | null = null;
  let workspaceId: string | null = null;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    sessionUserId = session.user.id;

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

    workspaceId = workspaceAccess.workspace.id;

    const params = await context.params;
    const paramsResult = chatParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      return NextResponse.json({ message: "Invalid chat id" }, { status: 400 });
    }

    const body = await req.json();
    const bodyResult = sendChatMessageSchema.safeParse(body);

    if (!bodyResult.success) {
      return NextResponse.json(
        { message: "Invalid message payload" },
        { status: 400 },
      );
    }

    const chat = await getChatByWorkspace(
      paramsResult.data.chatId,
      session.user.id,
      workspaceAccess.workspace.id,
    );

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    chatId = chat.id;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { message: "Missing GROQ_API_KEY" },
        { status: 500 },
      );
    }

    const userMessageText = bodyResult.data.message.trim();

    const userMessage = await addChatMessage({
      chatId: chat.id,
      role: "user",
      content: userMessageText,
    });

    emitChatMessageCreated(session.user.id, {
      workspaceId: workspaceAccess.workspace.id,
      chatId: chat.id,
      messageId: userMessage.id,
      role: "user",
      occurredAt: new Date().toISOString(),
    });

    const history = await getChatMessagesByWorkspace(
      chat.id,
      session.user.id,
      workspaceAccess.workspace.id,
    );

    if (!history) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    let relevantNotes: Awaited<
      ReturnType<typeof getSemanticRelevantNotesByWorkspace>
    > = [];

    try {
      const queryEmbedding = await embedText(userMessageText);
      relevantNotes = await getSemanticRelevantNotesByWorkspace(
        session.user.id,
        workspaceAccess.workspace.id,
        queryEmbedding,
        5,
      );
    } catch (retrievalError) {
      console.error("Semantic retrieval error:", retrievalError);
    }

    const noteContext = formatRelevantNotes(relevantNotes);

    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are Synapse, a helpful AI assistant inside a knowledge workspace. Keep responses clear, useful, and concise.",
          },
          {
            role: "system",
            content: [
              "The following user notes are the primary context for this reply.",
              "Use them when relevant.",
              "If the answer is not supported by the notes, say that clearly instead of pretending the notes contain it.",
              "",
              noteContext,
            ].join("\n"),
          },
          ...history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
      },
    );

    const groqData = groqResponse.data;

    if (!groqData) {
      return NextResponse.json(
        { message: "Groq request failed" },
        { status: groqResponse.status },
      );
    }

    const assistantReply =
      typeof groqData?.choices?.[0]?.message?.content === "string" &&
      groqData.choices[0].message.content.trim()
        ? groqData.choices[0].message.content
        : "No response returned.";

    const assistantMessage = await addChatMessage({
      chatId: chat.id,
      role: "assistant",
      content: assistantReply,
    });

    emitChatMessageCreated(session.user.id, {
      workspaceId: workspaceAccess.workspace.id,
      chatId: chat.id,
      messageId: assistantMessage.id,
      role: "assistant",
      occurredAt: new Date().toISOString(),
    });

    if (chat.title === "New Chat") {
      await updateChatTitleInWorkspace(
        chat.id,
        userMessageText.slice(0, 20).replace(/\s+\S*$/, ""),
        session.user.id,
        workspaceAccess.workspace.id,
      );
    } else {
      await touchChatInWorkspace(
        chat.id,
        session.user.id,
        workspaceAccess.workspace.id,
      );
    }

    emitChatChanged(session.user.id, {
      action: "updated",
      workspaceId: workspaceAccess.workspace.id,
      chatId: chat.id,
      occurredAt: new Date().toISOString(),
    });

    return NextResponse.json({
      reply: assistantReply,
      assistantMessage,
    });
  } catch (error) {
    console.error("Send workspace chat message error:", error);

    if (chatId && sessionUserId && workspaceId) {
      const fallbackMessage = await addChatMessage({
        chatId,
        role: "assistant",
        content: "I couldn't generate a response right now. Please try again.",
      });

      emitChatMessageCreated(sessionUserId, {
        workspaceId,
        chatId,
        messageId: fallbackMessage.id,
        role: "assistant",
        occurredAt: new Date().toISOString(),
      });

      emitChatChanged(sessionUserId, {
        action: "updated",
        workspaceId,
        chatId,
        occurredAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
