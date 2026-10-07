import { getRelevantContextItems } from "@/lib/db/queries/embeddings";
import { embedText } from "@/lib/ai/embeddings";
import { getAllContextItems } from "@/lib/db/queries/context";

export async function retrieveContext(query: string) {
  try {
    const embedding = await embedText(query);
    const relevant = await getRelevantContextItems(embedding);

    if (relevant.length > 0) {
      return relevant;
    }
  } catch (error) {
    console.error("Vector retrieval unavailable, using keyword fallback:", error);
  }

  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const items = await getAllContextItems();

  return items
    .map((item) => ({
      ...item,
      sourceType: item.sourceType,
      similarity: queryTerms.reduce(
        (score, term) => score + (item.content.toLowerCase().includes(term) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6);
}
