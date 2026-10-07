import axios from "axios";
import { AxiosError } from "axios";

const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS ?? 384);
const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL ?? "sentence-transformers/all-MiniLM-L6-v2";

function getEmbeddingApiUrl() {
  return (
    process.env.EMBEDDING_API_URL ??
    `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}/pipeline/feature-extraction`
  );
}

function normalizeEmbeddingInput(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 8000);
}

function parseEmbedding(data: unknown) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  if (data.every((value) => typeof value === "number")) {
    return data as number[];
  }

  const vectors = data.filter(
    (value): value is number[] =>
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((component) => typeof component === "number"),
  );

  if (vectors.length === 0) {
    return null;
  }

  const dimensions = vectors[0].length;
  const pooled = Array.from({ length: dimensions }, (_, index) =>
    vectors.reduce((sum, vector) => sum + vector[index], 0) / vectors.length,
  );
  const magnitude = Math.sqrt(
    pooled.reduce((sum, component) => sum + component * component, 0),
  );

  return magnitude === 0
    ? pooled
    : pooled.map((component) => component / magnitude);
}

export async function embedText(text: string) {
  const input = normalizeEmbeddingInput(text);

  if (!input) {
    throw new Error("Cannot embed empty text.");
  }

  try {
    const response = await axios.post(
      getEmbeddingApiUrl(),
      {
        inputs: input,
        normalize: true,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.EMBEDDING_API_KEY!}`,
          "Content-Type": "application/json",
        },
      },
    );

    const embedding = parseEmbedding(response.data);

    if (!Array.isArray(embedding)) {
      throw new Error("Embedding response did not contain a valid vector.");
    }

    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimensions mismatch. Expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}.`,
      );
    }

    return embedding as number[];
  } catch (err: unknown) {
    let errorText = "Unknown error";

    if (axios.isAxiosError(err)) {
      const axiosErr = err as AxiosError;

      if (typeof axiosErr.response?.data === "string") {
        errorText = axiosErr.response.data;
      } else if (axiosErr.response?.data) {
        errorText = JSON.stringify(axiosErr.response.data);
      } else if (axiosErr.message) {
        errorText = axiosErr.message;
      }
    } else if (err instanceof Error) {
      errorText = err.message;
    }

    throw new Error(`Embedding request failed: ${errorText}`);
  }
}
