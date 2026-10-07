import { getContextEmbeddingQueue } from "./queues";

export async function enqueueContextEmbeddingJob(contextId: string) {
  await getContextEmbeddingQueue().add(
    "embed-context",
    { contextId },
    {
      jobId: contextId,
    },
  );
}
