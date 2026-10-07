import { Worker } from "bullmq";
import { createWorkerConnection } from "@/lib/queue/connection";
import {
  CONTEXT_EMBEDDING_QUEUE_NAME,
  type ContextEmbeddingJobData,
} from "@/lib/queue/queues";
import { getContextItem } from "@/lib/db/queries/context";
import { upsertContextEmbedding } from "@/lib/db/queries/embeddings";
import { embedText } from "@/lib/ai/embeddings";

console.log("Context embedding worker started...");

export const contextEmbeddingWorker = new Worker<ContextEmbeddingJobData>(
  CONTEXT_EMBEDDING_QUEUE_NAME,
  async (job) => {
    const item = await getContextItem(job.data.contextId);
    if (!item) return;

    const embedding = await embedText(item.content);
    await upsertContextEmbedding({
      contextId: item.id,
      embedding,
      sourceText: item.content,
    });
  },
  { connection: createWorkerConnection() },
);

contextEmbeddingWorker.on("completed", (job) => {
  console.log(`Context embedding completed: ${job.id}`);
});

contextEmbeddingWorker.on("failed", (job, error) => {
  console.error(`Context embedding failed: ${job?.id}`, error);
});
