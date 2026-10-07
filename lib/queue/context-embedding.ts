import { getContextEmbeddingQueue } from "./queues";

export async function enqueueContextEmbeddingJob(contextId: string) {
  await getContextEmbeddingQueue().add(
    "embed-context",
    { contextId },
    {
      jobId: contextId,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );
}
