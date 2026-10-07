import { UnrecoverableError, Worker } from "bullmq";
import { createWorkerConnection } from "@/lib/queue/connection";
import {
  CONTEXT_EMBEDDING_QUEUE_NAME,
  type ContextEmbeddingJobData,
} from "@/lib/queue/queues";
import { getContextItem } from "@/lib/db/queries/context";
import {
  listContextChunks,
  replaceContextChunks,
  updateContextEmbeddingStatus,
} from "@/lib/db/queries/context";
import { upsertContextChunkEmbedding } from "@/lib/db/queries/embeddings";
import { EMBEDDING_MODEL, embedText } from "@/lib/ai/embeddings";
import { getSafeProviderMessage } from "@/lib/ai/provider-error";
import { ProviderError } from "@/lib/ai/provider-error";
import { chunkText } from "@/lib/rag/chunking";

const workerConcurrency = Number.parseInt(
  process.env.EMBEDDING_WORKER_CONCURRENCY ?? "2",
  10,
);

if (!Number.isInteger(workerConcurrency) || workerConcurrency < 1) {
  throw new Error("EMBEDDING_WORKER_CONCURRENCY must be a positive integer");
}

export const contextEmbeddingWorker = new Worker<ContextEmbeddingJobData>(
  CONTEXT_EMBEDDING_QUEUE_NAME,
  async (job) => {
    const item = await getContextItem(job.data.contextId);
    if (!item) {
      console.warn(
        JSON.stringify({ event: "embedding_context_missing", jobId: job.id }),
      );
      return { skipped: true };
    }

    await updateContextEmbeddingStatus(item.id, "processing");

    try {
      const chunks = chunkText(item.content);
      await replaceContextChunks(item.id, chunks);
      const storedChunks = await listContextChunks(item.id);

      for (const [index, chunk] of chunks.entries()) {
        const embedding = await embedText(chunk.content);
        const storedChunk = storedChunks[index];
        if (!storedChunk) throw new Error("Chunk disappeared during embedding.");

        await upsertContextChunkEmbedding({
          chunkId: storedChunk.id,
          embedding,
          model: EMBEDDING_MODEL,
        });
        await job.updateProgress(Math.round(((index + 1) / chunks.length) * 100));
      }

      await updateContextEmbeddingStatus(item.id, "completed");
    } catch (error) {
      const message = getSafeProviderMessage(error);
      if (
        error instanceof ProviderError &&
        ["quota_exhausted", "configuration", "invalid_response"].includes(error.code)
      ) {
        await updateContextEmbeddingStatus(item.id, "degraded", message);
        throw new UnrecoverableError(message);
      }

      const attempts = job.opts.attempts ?? 1;
      const finalAttempt = job.attemptsMade + 1 >= attempts;
      await updateContextEmbeddingStatus(
        item.id,
        finalAttempt ? "failed" : "processing",
        finalAttempt ? message : null,
      );
      throw error;
    }

    return { contextId: item.id };
  },
  {
    connection: createWorkerConnection(),
    concurrency: workerConcurrency,
    lockDuration: 120_000,
    maxStalledCount: 2,
    stalledInterval: 30_000,
  },
);

contextEmbeddingWorker.on("completed", (job) => {
  console.log(JSON.stringify({ event: "embedding_completed", jobId: job.id }));
});

contextEmbeddingWorker.on("failed", (job, error) => {
  console.error(
    JSON.stringify({
      event: "embedding_failed",
      jobId: job?.id,
      error: error.message,
      attemptsMade: job?.attemptsMade,
    }),
  );
});

contextEmbeddingWorker.on("error", (error) => {
  console.error(
    JSON.stringify({ event: "embedding_worker_error", error: error.message }),
  );
});

console.log(
  JSON.stringify({
    event: "embedding_worker_started",
    concurrency: workerConcurrency,
  }),
);

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(JSON.stringify({ event: "embedding_worker_shutdown", signal }));

  await contextEmbeddingWorker.close();
  process.exit(0);
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error(
    JSON.stringify({ event: "embedding_worker_unhandled_rejection", reason }),
  );
  process.exitCode = 1;
});
process.on("uncaughtException", (error) => {
  console.error(
    JSON.stringify({
      event: "embedding_worker_uncaught_exception",
      error: error.message,
    }),
  );
  process.exit(1);
});
