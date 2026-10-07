import { Queue } from "bullmq";
import { createQueueConnection } from "./connection";

export const CONTEXT_EMBEDDING_QUEUE_NAME = "context-embedding";

export type ContextEmbeddingJobData = { contextId: string };

export const contextEmbeddingQueue = new Queue<ContextEmbeddingJobData>(
  CONTEXT_EMBEDDING_QUEUE_NAME,
  { connection: createQueueConnection() },
);
