import { getProviderErrorCode, ProviderError } from "./provider-error";

export const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS ?? 2048);
export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL ?? "nvidia/nemotron-3-embed-1b:free";

function getEmbeddingApiUrl() {
  return (
    process.env.EMBEDDING_API_URL ??
    `${process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"}/embeddings`
  );
}

function normalizeEmbeddingInput(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 8000);
}

function parseEmbedding(data: unknown) {
  const payload =
    typeof data === "object" && data !== null && "data" in data
      ? (data as { data?: unknown }).data
      : data;

  if (!Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const first = payload[0];
  if (
    typeof first === "object" &&
    first !== null &&
    "embedding" in first
  ) {
    const embedding = (first as { embedding?: unknown }).embedding;
    return Array.isArray(embedding) &&
      embedding.every((value) => typeof value === "number")
      ? (embedding as number[])
      : null;
  }

  if (payload.every((value) => typeof value === "number")) {
    return payload as number[];
  }

  const vectors = payload.filter(
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

  const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENROUTER_API_KEY;
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
        input,
        model: EMBEDDING_MODEL,
        encoding_format: "float",
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
