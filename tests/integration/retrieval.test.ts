import { describe, expect, it, vi } from "vitest";
import { ProviderError } from "@/lib/ai/provider-error";

const { embedText, getRelevantContextChunks, listAllContextChunks, getAllContextItems } =
  vi.hoisted(() => ({
    embedText: vi.fn(),
    getRelevantContextChunks: vi.fn(),
    listAllContextChunks: vi.fn(),
    getAllContextItems: vi.fn(),
  }));

vi.mock("@/lib/ai/embeddings", () => ({ embedText }));
vi.mock("@/lib/db/queries/embeddings", () => ({ getRelevantContextChunks }));
vi.mock("@/lib/db/queries/context", () => ({
  listAllContextChunks,
  getAllContextItems,
}));

import { retrieveContext } from "@/lib/rag/retrieval";

describe("RAG retrieval", () => {
  it("returns vector results with source metadata", async () => {
    embedText.mockResolvedValueOnce([0.1, 0.2]);
    getRelevantContextChunks.mockResolvedValueOnce([
      {
        id: "chunk-1",
        contextId: "context-1",
        name: "Design notes",
        sourceType: "md",
        content: "Use queues for indexing.",
        chunkIndex: 1,
        startChar: 120,
        endChar: 144,
        similarity: 0.91,
      },
    ]);

    const result = await retrieveContext("How should indexing work?");

    expect(result.mode).toBe("vector");
    expect(result.items[0]).toMatchObject({
      name: "Design notes",
      chunkIndex: 1,
      startChar: 120,
    });
  });

  it("falls back cleanly when the embedding provider quota is exhausted", async () => {
    embedText.mockRejectedValueOnce(
      new ProviderError("quota", "quota_exhausted", 402),
    );
    listAllContextChunks.mockResolvedValueOnce([
      {
        id: "chunk-2",
        contextId: "context-2",
        name: "Redis plan",
        sourceType: "txt",
        content: "Redis handles background indexing jobs.",
        chunkIndex: 0,
        startChar: 0,
        endChar: 39,
      },
    ]);

    const result = await retrieveContext("Redis indexing");

    expect(result.mode).toBe("keyword");
    expect(result.items[0].name).toBe("Redis plan");
    expect(result.warning).toContain("quota is exhausted");
  });
});
