import { NextRequest, NextResponse } from "next/server";
import {
  extractContextText,
  getSourceType,
  normalizeContextText,
} from "@/lib/context/extract";
import {
  createContextItem,
  listContextItems,
  updateContextEmbeddingStatus,
} from "@/lib/db/queries/context";
import { enqueueContextEmbeddingJob } from "@/lib/queue/context-embedding";

const MAX_CONTEXT_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const contexts = await listContextItems();
  return NextResponse.json({ contexts });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const rawText = formData.get("text");
    const requestedName = formData.get("name");

    let name = typeof requestedName === "string" ? requestedName.trim() : "";
    let sourceType: "text" | "txt" | "md" | "pdf" | "docx" = "text";
    let content = "";

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_CONTEXT_BYTES) {
        return NextResponse.json(
          { message: "Files must be smaller than 10 MB." },
          { status: 413 },
        );
      }

      const detectedType = getSourceType(file.name);
      if (!detectedType) {
        return NextResponse.json(
          { message: "Supported files: .txt, .md, .pdf, and .docx." },
          { status: 400 },
        );
      }

      sourceType = detectedType;
      name ||= file.name;
      content = normalizeContextText(await extractContextText(file, detectedType));
    } else if (typeof rawText === "string") {
      content = normalizeContextText(rawText);
      name ||= "Pasted context";
    }

    if (!content) {
      return NextResponse.json(
        { message: "Add some text or upload a supported file first." },
        { status: 400 },
      );
    }

    const item = await createContextItem({
      name: name.slice(0, 160),
      sourceType,
      content,
      characterCount: content.length,
    });

    let embeddingStatus: "pending" | "failed" = "pending";
    let embeddingError: string | undefined;

    try {
      await enqueueContextEmbeddingJob(item.id);
    } catch (error) {
      embeddingStatus = "failed";
      embeddingError = error instanceof Error ? error.message : "Queue unavailable";
      await updateContextEmbeddingStatus(item.id, "failed", embeddingError);
      console.error("Context embedding queue error:", error);
    }

    return NextResponse.json(
      {
        context: {
          id: item.id,
          name: item.name,
          sourceType: item.sourceType,
          characterCount: item.characterCount,
          embeddingStatus,
          embeddingError,
        },
      },
      { status: embeddingStatus === "failed" ? 202 : 201 },
    );
  } catch (error) {
    console.error("Context ingestion error:", error);
    return NextResponse.json(
      { message: "Unable to add this context." },
      { status: 500 },
    );
  }
}
