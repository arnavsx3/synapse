import axios from "axios";

const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS ?? 384);

function normalizeEmbeddingInput(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 8000);
}

export async function embedText(text: string) {
  const input = normalizeEmbeddingInput(text);

  if (!input) {
    throw new Error("Cannot embed empty text.");
  }

  try {
    const response = await axios.post(
      process.env.EMBEDDING_API_URL!,
      {
        inputs: input,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.EMBEDDING_API_KEY!}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = response.data;
    const embedding = Array.isArray(data?.[0]) ? data[0] : data;

    if (!Array.isArray(embedding)) {
      throw new Error("Embedding response did not contain a valid vector.");
    }

    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimensions mismatch. Expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}.`,
      );
    }

    return embedding as number[];
  } catch (error: any) {
    const errorText =
      typeof error?.response?.data === "string"
        ? error.response.data
        : JSON.stringify(error?.response?.data ?? error.message);

    throw new Error(`Embedding request failed: ${errorText}`);
  }
}
