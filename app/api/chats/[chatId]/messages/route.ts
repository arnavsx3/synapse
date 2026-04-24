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
  chatParamsSchema,
  sendChatMessageSchema,
} from "@/lib/validators/chats";
import axios from "axios";

export async function GET(context: { params: Promise<{ chatId: string }> }) {
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

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
