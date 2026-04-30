import { noteEmbeddingQueue } from "./queues";

type EnqueueNoteEmbeddingJobInput = {
  noteId: string;
  userId: string;
};

export async function enqueueNoteEmbeddingJob(
  data: EnqueueNoteEmbeddingJobInput,
) {
  await noteEmbeddingQueue.add("embed-note", data, {
    jobId: data.noteId,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
}
