import { NextRequest, NextResponse } from "next/server";
import { createChatMessage, listChatMessages } from "@/lib/db/queries/chat";
import { getSafeProviderMessage } from "@/lib/ai/provider-error";
import { retrieveContext } from "@/lib/rag/retrieval";

function formatContext(items: Awaited<ReturnType<typeof retrieveContext>>["items"]) {
  if (items.length === 0) return "No context has been added yet.";

  return items
    .map((item, index) => {
      const excerpt = item.content.replace(/\s+/g, " ").trim().slice(0, 3000);
      return `SOURCE ${index + 1}: ${item.name} (chunk ${item.chunkIndex + 1}, characters ${item.startChar}-${item.endChar})\n${excerpt}`;
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
    const retrieval = await retrieveContext(message);
    const contextItems = retrieval.items;
    const context = formatContext(contextItems);
    const history = await listChatMessages();
    const apiKey = process.env.LLM_API_KEY;
    const apiUrl = process.env.LLM_API_URL ?? "https://router.huggingface.co/v1/chat/completions";
    const model =
      process.env.LLM_MODEL ?? "TinyLlama/TinyLlama-1.1B-Chat-v1.0";

    let reply = `I found ${contextItems.length} context source${contextItems.length === 1 ? "" : "s"}. Ask me something about it.`;
    let warning = retrieval.warning;

    if (apiKey) {
      try {
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
      } catch (error) {
        console.error("LLM provider unavailable:", getSafeProviderMessage(error));
        warning = warning
          ? `${warning} The language model is unavailable, so a local response was returned.`
          : "The language model is unavailable, so a local response was returned.";
      }
    }

    const assistantMessage = await createChatMessage({ role: "assistant", content: reply });
    return NextResponse.json({
      message: assistantMessage,
      sources: contextItems.map(({ id, contextId, name, sourceType, chunkIndex, startChar, endChar, similarity }) => ({
        id,
        contextId,
        name,
        sourceType,
        chunkIndex,
        startChar,
        endChar,
        similarity,
      })),
      retrievalMode: retrieval.mode,
      warning,
    });
  } catch (error) {
    console.error("Chat request error:", error);
    return NextResponse.json({ message: "The chat service is unavailable right now." }, { status: 500 });
  }
}
