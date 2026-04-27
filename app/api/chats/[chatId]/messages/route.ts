import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  addChatMessage,
  getChatByUser,
  getChatMessagesByUser,
  touchChat,
  updateChatTitle,
} from "@/lib/db/queries/chats";
import {
  getRelevantNotesByUser,
  type RelevantNote,
} from "@/lib/db/queries/notes";
import {
  chatParamsSchema,
  sendChatMessageSchema,
} from "@/lib/validators/chats";
import axios from "axios";

const MAX_NOTE_CONTENT_LENGTH = 500;

const buildNoteExcerpt = (content: string | null) => {
  const normalized = (content ?? "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "Empty note";
  }

  if (normalized.length <= MAX_NOTE_CONTENT_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_NOTE_CONTENT_LENGTH)}...`;
};

const formatRelevantNotes = (relevantNotes: RelevantNote[]) => {
  if (relevantNotes.length === 0) {
    return "No relevant user notes were found.";
  }

  return relevantNotes
    .map((note, index) => {
      const location = note.projectName
        ? `Project: ${note.projectName}`
        : "Project: Inbox";

      return [
        `Note ${index + 1}`,
        `Title: ${note.title}`,
        location,
        `Match Score: ${note.score}`,
        `Content: ${buildNoteExcerpt(note.content)}`,
      ].join("\n");
    })
    .join("\n\n");
};

const buildSystemMessages = (
  noteContext: string,
  hasRelevantNotes: boolean,
) => {
  return [
    {
      role: "system" as const,
      content: [
        "You are Synapse, a helpful AI assistant inside a personal knowledge workspace.",
        "Your main job is to help the user think with their saved notes.",
        "Be clear, practical, and concise.",
      ].join(" "),
    },
    {
      role: "system" as const,
      content: hasRelevantNotes
        ? [
            "Use the retrieved notes below as your primary grounding context when they are relevant.",
            "Prefer note-supported answers over generic advice.",
            "If the notes only partially support the answer, say what is supported and what is not.",
            "Do not pretend the notes contain facts they do not contain.",
            "",
            "Retrieved notes:",
            noteContext,
          ].join("\n")
        : [
            "No strong note context was found for this message.",
            "You may still help generally, but be explicit that the answer is not grounded in saved notes.",
          ].join("\n"),
    },
  ];
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ chatId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const paramsResult = chatParamsSchema.safeParse(params);

    if (!paramsResult.success) {
      return NextResponse.json({ message: "Invalid chat id" }, { status: 400 });
    }

    const messages = await getChatMessagesByUser(
      paramsResult.data.chatId,
      session.user.id,
    );
    if (!messages) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get chat messages error:", error);

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ chatId: string }> },
) {
  let chatId: string | null = null;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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

    const chat = await getChatByUser(paramsResult.data.chatId, session.user.id);
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

    await addChatMessage({
      chatId: chat.id,
      role: "user",
      content: userMessageText,
    });

    const history = await getChatMessagesByUser(chat.id, session.user.id);

    if (!history) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    const relevantNotes = await getRelevantNotesByUser(
      session.user.id,
      userMessageText,
      5,
    );

    const strongNotes = relevantNotes.filter((note) => note.score > 0);
    const noteContext = formatRelevantNotes(strongNotes);
    const systemMessages = buildSystemMessages(
      noteContext,
      strongNotes.length > 0,
    );

    const groqResponse = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        temperature: 0.4,
        messages: [
          ...systemMessages,
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

    const groqData = await groqResponse.data;
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

    if (chat.title === "New Chat") {
      await updateChatTitle(
        chat.id,
        userMessageText.slice(0, 20).replace(/\s+\S*$/, ""),
        session.user.id,
      );
    } else {
      await touchChat(chat.id, session.user.id);
    }

    return NextResponse.json({
      reply: assistantReply,
      assistantMessage,
    });
  } catch (error) {
    console.error("Send chat message error:", error);

    if (chatId) {
      await addChatMessage({
        chatId,
        role: "assistant",
        content: "I couldn’t generate a response right now. Please try again.",
      });
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
