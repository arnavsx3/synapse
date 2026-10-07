export const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS ?? 384);
export const EMBEDDING_MODEL =
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

  const apiKey = process.env.EMBEDDING_API_KEY;
  if (!apiKey) {
    throw new ProviderError("Missing EMBEDDING_API_KEY.", "configuration");
  }

  try {
    const response = await fetch(getEmbeddingApiUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: input,
        normalize: true,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const responseText = await response.text();
    let responseData: unknown = null;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      const detail =
        typeof responseData === "string"
          ? responseData
          : JSON.stringify(responseData);
      throw new ProviderError(
        `Embedding provider returned ${response.status}: ${detail}`,
        getProviderErrorCode(response.status),
        response.status,
      );
    }

    const embedding = parseEmbedding(responseData);

    if (!Array.isArray(embedding)) {
      throw new ProviderError(
        "Embedding response did not contain a valid vector.",
        "invalid_response",
      );
    }

    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new ProviderError(
        `Embedding dimensions mismatch. Expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}.`,
        "invalid_response",
      );
    }

    return embedding as number[];
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    const errorText = error instanceof Error ? error.message : "Unknown error";
    throw new ProviderError(
      `Embedding request failed: ${errorText}`,
      "unknown",
    );
  }
}
import {
  getProviderErrorCode,
  ProviderError,
} from "./provider-error";
