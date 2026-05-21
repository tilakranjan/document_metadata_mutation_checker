import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { analyzePdf } from "./analyzer";

describe("analyzePdf", () => {
  it("rejects non-PDF bytes", async () => {
    await expect(analyzePdf({ fileName: "note.txt", fileType: "text/plain", bytes: new TextEncoder().encode("hello") })).rejects.toThrow("Only PDF files");
  });

  it("returns a structured report for a PDF", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([300, 300]);
    doc.setTitle("Assessment");
    doc.setAuthor("");
    doc.setCreator("Canva");
    doc.setProducer("Adobe Acrobat");
    doc.setCreationDate(new Date("2026-04-01T10:00:00Z"));
    doc.setModificationDate(new Date("2026-04-12T10:00:00Z"));
    const bytes = await doc.save();

    const report = await analyzePdf({ fileName: "assessment.pdf", fileType: "application/pdf", bytes });
    expect(report.document_name).toBe("assessment.pdf");
    expect(report.extracted_metadata.page_count).toBe(1);
    expect(report.findings.length).toBeGreaterThan(0);
    expect(JSON.stringify(report).toLowerCase()).not.toContain("fake");
  });
});
