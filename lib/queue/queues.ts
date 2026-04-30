import { Queue } from "bullmq";
import { createQueueConnection } from "./connection";

export const NOTE_EMBEDDING_QUEUE_NAME = "note-embedding";

export type NoteEmbeddingJobData = {
  noteId: string;
  userId: string;
};

export const noteEmbeddingQueue = new Queue<NoteEmbeddingJobData>(
  NOTE_EMBEDDING_QUEUE_NAME,
  {
    connection: createQueueConnection(),
  },
);
