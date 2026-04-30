import { Worker } from "bullmq";
import {
  NOTE_EMBEDDING_QUEUE_NAME,
  type NoteEmbeddingJobData,
} from "@/lib/queue/queues";
import { createWorkerConnection } from "@/lib/queue/connection";
import { syncNoteEmbeddingByNoteId } from "@/lib/ai/note-embeddings";

console.log("Worker started...");

export const noteEmbeddingWorker = new Worker<NoteEmbeddingJobData>(
  NOTE_EMBEDDING_QUEUE_NAME,
  async (job) => {
    const { noteId, userId } = job.data;
    await syncNoteEmbeddingByNoteId(noteId, userId);
  },
  {
    connection: createWorkerConnection(),
  },
);

noteEmbeddingWorker.on("completed", (job) => {
  console.log(`Embedding job completed: ${job.id}`);
});

noteEmbeddingWorker.on("failed", (job, error) => {
  console.error(`Embedding job failed: ${job?.id}`, error);
});