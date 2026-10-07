import { embedText } from "@/lib/ai/embeddings";
import { getSafeProviderMessage, ProviderError } from "@/lib/ai/provider-error";
import {
  getRelevantContextChunks,
} from "@/lib/db/queries/embeddings";
import {
  listAllContextChunks,
  getAllContextItems,
} from "@/lib/db/queries/context";
import { RAG_CONFIG } from "./config";

export type RetrievedContext = {
  id: string;
  contextId: string;
  name: string;
  sourceType: string;
  content: string;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  similarity: number;
};

export type RetrievalResult = {
  items: RetrievedContext[];
  mode: "vector" | "keyword";
  warning?: string;
};

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "how", "in", "is", "it", "of", "on", "or", "that", "the", "this",
  "to", "was", "what", "when", "where", "which", "who", "with",
]);

function queryTerms(query: string) {
  return query
    .toLowerCase()
    .slice(0, RAG_CONFIG.maxQueryLength)
    .match(/[\p{L}\p{N}]{2,}/gu)
    ?.filter((term) => !stopWords.has(term)) ?? [];
}

function diversify(items: RetrievedContext[]) {
  const counts = new Map<string, number>();
  return items.filter((item) => {
    const count = counts.get(item.contextId) ?? 0;
    if (count >= RAG_CONFIG.maxChunksPerContext) return false;
    counts.set(item.contextId, count + 1);
    return true;
  });
}

async function keywordFallback(query: string): Promise<RetrievedContext[]> {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];

  const phrase = query.trim().toLowerCase();
  const chunks = await listAllContextChunks();
  const searchableChunks = chunks.length > 0
    ? chunks
    : (await getAllContextItems()).map((item) => ({
        id: item.id,
        contextId: item.id,
        name: item.name,
        sourceType: item.sourceType,
        content: item.content,
        chunkIndex: 0,
        startChar: 0,
        endChar: item.characterCount,
      }));
  const scored = searchableChunks.map((chunk) => {
    const haystack = `${chunk.name} ${chunk.content}`.toLowerCase();
    const matchedTerms = terms.filter((term) => haystack.includes(term));
    const titleMatches = terms.filter((term) => chunk.name.toLowerCase().includes(term));
    const phraseMatch = phrase.length > 3 && chunk.content.toLowerCase().includes(phrase);
    const score =
      matchedTerms.length / terms.length +
      titleMatches.length / Math.max(terms.length, 1) * 0.5 +
      (phraseMatch ? 0.5 : 0);

    return { ...chunk, similarity: Math.min(score, 1) };
  });

  return diversify(
    scored
      .filter((item) => item.similarity > 0)
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, RAG_CONFIG.retrievalLimit),
  );
}

function providerWarning(error: unknown) {
  if (error instanceof ProviderError && error.code === "quota_exhausted") {
    return "Semantic retrieval is unavailable because the embedding provider quota is exhausted; keyword search is active.";
  }

  if (error instanceof ProviderError && error.code === "rate_limited") {
    return "Semantic retrieval is temporarily rate-limited; keyword search is active.";
  }

  return "Semantic retrieval is unavailable; keyword search is active.";
}

export async function retrieveContext(query: string): Promise<RetrievalResult> {
  try {
    const embedding = await embedText(query);
    const relevant = await getRelevantContextChunks(
      embedding,
      RAG_CONFIG.retrievalLimit,
      RAG_CONFIG.minimumVectorSimilarity,
    );
    const items = diversify(relevant);

    if (items.length > 0) {
      return { items, mode: "vector" };
    }

    return {
      items: await keywordFallback(query),
      mode: "keyword",
      warning: "No semantic matches were found; keyword search is active.",
    };
  } catch (error) {
    console.error("Vector retrieval unavailable:", getSafeProviderMessage(error));
    return {
      items: await keywordFallback(query),
      mode: "keyword",
      warning: providerWarning(error),
    };
  }
}
