import { NextRequest, NextResponse } from "next/server";
import { createChatMessage, listChatMessages } from "@/lib/db/queries/chat";
import { retrieveContext } from "@/lib/context/retrieval";

function formatContext(items: Awaited<ReturnType<typeof retrieveContext>>) {
  if (items.length === 0) return "No context has been added yet.";

  return items
    .map((item, index) => {
      const excerpt = item.content.replace(/\s+/g, " ").trim().slice(0, 5000);
      return `SOURCE ${index + 1}: ${item.name}\n${excerpt}`;
    })
    .join("\n\n");
}

export async function GET() {
  return NextResponse.json({ messages: await listChatMessages() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ message: "Write a message first." }, { status: 400 });
    }

    await createChatMessage({ role: "user", content: message });
    const contextItems = await retrieveContext(message);
    const context = formatContext(contextItems);
    const history = await listChatMessages();
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL ?? "https://router.huggingface.co/v1/chat/completions";
    const model =
      process.env.LLM_MODEL ?? "TinyLlama/TinyLlama-1.1B-Chat-v1.0";

    let reply = `I found ${contextItems.length} context source${contextItems.length === 1 ? "" : "s"}. Ask me something about it.`;

    if (apiKey) {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content: "You are Synapse, a concise assistant grounded in the supplied context. If the answer is not supported, say so clearly.",
            },
            { role: "system", content: `CONTEXT:\n${context}` },
            ...history.slice(-12).map((item) => ({ role: item.role, content: item.content })),
          ],
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        throw new Error(`LLM provider returned ${response.status}`);
      }

      const responseData = (await response.json()) as {
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      const providerReply = responseData.choices?.[0]?.message?.content;
      if (typeof providerReply === "string") {
        reply = providerReply.trim() || reply;
      }
    }

    const assistantMessage = await createChatMessage({ role: "assistant", content: reply });
    return NextResponse.json({ message: assistantMessage, sources: contextItems });
  } catch (error) {
    console.error("Chat request error:", error);
    return NextResponse.json({ message: "The chat service is unavailable right now." }, { status: 500 });
  }
}
