import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export const SUPPORTED_EXTENSIONS = ["txt", "md", "pdf", "docx"] as const;
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

export function getSourceType(name: string): SupportedExtension | null {
  const extension = name.toLowerCase().split(".").pop();
  return SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)
    ? (extension as SupportedExtension)
    : null;
}

export async function extractContextText(
  file: File,
  sourceType: SupportedExtension,
) {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (sourceType === "txt" || sourceType === "md") {
    return buffer.toString("utf8");
  }

  if (sourceType === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export function normalizeContextText(value: string) {
  return value.replace(/\u0000/g, "").replace(/\r\n/g, "\n").trim();
}
