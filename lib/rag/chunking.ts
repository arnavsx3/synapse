export type ContextChunk = {
  index: number;
  content: string;
  startChar: number;
  endChar: number;
  characterCount: number;
};

export type ChunkOptions = {
  maxCharacters?: number;
  overlapCharacters?: number;
};

function splitOversizedParagraph(
  paragraph: { text: string; start: number },
  maxCharacters: number,
) {
  const pieces: Array<{ text: string; start: number }> = [];
  let offset = 0;

  while (offset < paragraph.text.length) {
    const end = Math.min(offset + maxCharacters, paragraph.text.length);
    pieces.push({
      text: paragraph.text.slice(offset, end),
      start: paragraph.start + offset,
    });
    offset = end;
  }

  return pieces;
}

function paragraphSegments(text: string, maxCharacters: number) {
  const segments: Array<{ text: string; start: number }> = [];
  const paragraphPattern = /[^\n]+(?:\n+|$)/g;
  let match: RegExpExecArray | null;

  while ((match = paragraphPattern.exec(text))) {
    const value = match[0].replace(/\n+$/, "");
    if (!value.trim()) continue;

    const start = match.index;
    if (value.length <= maxCharacters) {
      segments.push({ text: value, start });
    } else {
      segments.push(...splitOversizedParagraph({ text: value, start }, maxCharacters));
    }
  }

  return segments;
}

export function chunkText(text: string, options: ChunkOptions = {}): ContextChunk[] {
  const maxCharacters = options.maxCharacters ?? RAG_CONFIG.chunkSize;
  const overlapCharacters = options.overlapCharacters ?? RAG_CONFIG.chunkOverlap;

  if (!Number.isInteger(maxCharacters) || maxCharacters < 64) {
    throw new Error("maxCharacters must be an integer of at least 64.");
  }

  if (
    !Number.isInteger(overlapCharacters) ||
    overlapCharacters < 0 ||
    overlapCharacters >= maxCharacters
  ) {
    throw new Error("overlapCharacters must be between 0 and maxCharacters.");
  }

  const segments = paragraphSegments(
    text,
    Math.max(maxCharacters - overlapCharacters, 1),
  );
  if (segments.length === 0) return [];

  const chunks: ContextChunk[] = [];
  let current = "";
  let currentStart = segments[0].start;

  const pushCurrent = () => {
    const content = current.trim();
    if (!content) return;

    const leadingWhitespace = current.search(/\S/);
    const startChar = currentStart + Math.max(leadingWhitespace, 0);
    chunks.push({
      index: chunks.length,
      content,
      startChar,
      endChar: startChar + content.length,
      characterCount: content.length,
    });
  };

  for (const segment of segments) {
    const separator = current ? "\n\n" : "";
    if (current && current.length + separator.length + segment.text.length > maxCharacters) {
      pushCurrent();
      const overlap = overlapCharacters > 0
        ? current.slice(-overlapCharacters).trim()
        : "";
      current = overlap ? `${overlap}\n\n${segment.text}` : segment.text;
      currentStart = overlap
        ? chunks[chunks.length - 1].endChar - overlap.length
        : segment.start;
      continue;
    }

    if (!current) currentStart = segment.start;
    current += `${separator}${segment.text}`;
  }

  pushCurrent();
  return chunks;
}
import { RAG_CONFIG } from "./config";
