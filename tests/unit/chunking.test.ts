import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/rag/chunking";

describe("chunkText", () => {
  it("keeps source offsets and produces deterministic chunks", () => {
    const text = "First paragraph.\n\n" + "Second paragraph with enough detail. ".repeat(3);
    const chunks = chunkText(text, { maxCharacters: 64, overlapCharacters: 5 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toMatchObject({ index: 0, startChar: 0 });
    expect(chunks.every((chunk) => chunk.characterCount === chunk.content.length)).toBe(true);
    expect(chunks.every((chunk) => chunk.endChar > chunk.startChar)).toBe(true);
    expect(chunkText(text, { maxCharacters: 64, overlapCharacters: 5 })).toEqual(chunks);
  });

  it("hard-splits a long paragraph without dropping content", () => {
    const text = "A".repeat(500);
    const chunks = chunkText(text, { maxCharacters: 200, overlapCharacters: 0 });

    expect(chunks.map((chunk) => chunk.content).join("")).toBe(text);
    expect(chunks.every((chunk) => chunk.content.length <= 200)).toBe(true);
  });
});
