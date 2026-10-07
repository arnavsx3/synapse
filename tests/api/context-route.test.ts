import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createContextItem,
  listContextItems,
  updateContextEmbeddingStatus,
  enqueueContextEmbeddingJob,
} = vi.hoisted(() => ({
  createContextItem: vi.fn(),
  listContextItems: vi.fn(),
  updateContextEmbeddingStatus: vi.fn(),
  enqueueContextEmbeddingJob: vi.fn(),
}));

vi.mock("@/lib/db/queries/context", () => ({
  createContextItem,
  listContextItems,
  updateContextEmbeddingStatus,
}));
vi.mock("@/lib/queue/context-embedding", () => ({ enqueueContextEmbeddingJob }));

import { POST } from "@/app/api/context/route";

describe("POST /api/context", () => {
  beforeEach(() => {
    createContextItem.mockResolvedValue({
      id: "context-1",
      name: "Project notes",
      sourceType: "text",
      characterCount: 24,
    });
    enqueueContextEmbeddingJob.mockResolvedValue(undefined);
  });

  it("stores pasted context and enqueues embedding", async () => {
    const form = new FormData();
    form.set("name", "Project notes");
    form.set("text", "A useful note for retrieval.");

    const response = await POST(
      new Request("http://localhost/api/context", { method: "POST", body: form }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createContextItem).toHaveBeenCalledWith(expect.objectContaining({
      name: "Project notes",
      sourceType: "text",
      content: "A useful note for retrieval.",
    }));
    expect(enqueueContextEmbeddingJob).toHaveBeenCalledWith("context-1");
    expect(body.context.embeddingStatus).toBe("pending");
  });

  it("keeps the context available when the queue is unavailable", async () => {
    enqueueContextEmbeddingJob.mockRejectedValueOnce(new Error("Redis unavailable"));

    const form = new FormData();
    form.set("text", "Still searchable through the fallback.");
    const response = await POST(
      new Request("http://localhost/api/context", { method: "POST", body: form }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(updateContextEmbeddingStatus).toHaveBeenCalledWith(
      "context-1",
      "failed",
      "Redis unavailable",
    );
    expect(body.context.embeddingStatus).toBe("failed");
  });
});
