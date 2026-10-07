import { Queue } from "bullmq";
import { createQueueConnection } from "./connection";

export const CONTEXT_EMBEDDING_QUEUE_NAME = "context-embedding";

const QUEUE_JOB_ATTEMPTS = 4;
const QUEUE_BACKOFF_DELAY_MS = 2_000;

export type ContextEmbeddingJobData = { contextId: string };

let contextEmbeddingQueue: Queue<ContextEmbeddingJobData> | null = null;

export function getContextEmbeddingQueue() {
  contextEmbeddingQueue ??= new Queue<ContextEmbeddingJobData>(
    CONTEXT_EMBEDDING_QUEUE_NAME,
    {
      connection: createQueueConnection(),
      defaultJobOptions: {
        attempts: QUEUE_JOB_ATTEMPTS,
        backoff: { type: "exponential", delay: QUEUE_BACKOFF_DELAY_MS },
        removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
      },
    },
  );
  return contextEmbeddingQueue;
}

export async function closeQueues() {
  if (!contextEmbeddingQueue) return;

  await contextEmbeddingQueue.close();
  contextEmbeddingQueue = null;
}
