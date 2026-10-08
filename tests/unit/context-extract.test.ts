import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import {
  extractContextText,
  getSourceType,
  normalizeContextText,
} from "@/lib/context/extract";

function createTestPdf(text: string) {
  const content = `BT /F1 18 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

async function createTestDocx(text: string) {
  const zip = new JSZip();

  zip.file(
    "[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      "</Types>",
  );
  zip.folder("_rels")?.file(
    ".rels",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      "</Relationships>",
  );
  zip.folder("word")?.file(
    "document.xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body>` +
      "</w:document>",
  );

  return zip.generateAsync({ type: "arraybuffer" });
}

describe("context file extraction", () => {
  it.each([
    ["notes.txt", "txt"],
    ["README.MD", "md"],
    ["reference.pdf", "pdf"],
    ["brief.docx", "docx"],
  ] as const)("recognizes %s", (filename, sourceType) => {
    expect(getSourceType(filename)).toBe(sourceType);
  });

  it("rejects unsupported extensions", () => {
    expect(getSourceType("archive.zip")).toBeNull();
  });

  it.each([
    ["txt", "Plain text context"],
    ["md", "# Markdown context"],
  ] as const)("extracts .%s files", async (sourceType, content) => {
    const file = new File([content], `context.${sourceType}`);

    await expect(extractContextText(file, sourceType)).resolves.toBe(content);
  });

  it("extracts PDF files with the packaged PDF.js worker", async () => {
    const file = new File([createTestPdf("Synapse PDF context")], "context.pdf");

    const content = await extractContextText(file, "pdf");

    expect(content).toContain("Synapse PDF context");
  });

  it("extracts DOCX files", async () => {
    const file = new File(
      [await createTestDocx("Synapse DOCX context")],
      "context.docx",
    );

    const content = await extractContextText(file, "docx");

    expect(normalizeContextText(content)).toBe("Synapse DOCX context");
  });
});
