import { describe, expect, it } from "vitest";
import type { ExtractedMetadata } from "@/types/report";
import { buildFindings } from "./rules";
import { scoreFindings } from "./scoring";

const baseMetadata: ExtractedMetadata = {
  file_name: "sample.pdf",
  file_size_bytes: 1000,
  file_type: "application/pdf",
  pdf_version: "1.7",
  created_date: "2026-04-01T10:00:00.000Z",
  modified_date: "2026-04-01T10:00:00.000Z",
  author: "Analyst",
  creator: "Microsoft Word",
  producer: "Microsoft Word",
  title: "Sample",
  subject: null,
  page_count: 1,
  encryption_status: "not_encrypted",
  eof_marker_count: 1,
  startxref_count: 1,
  has_xmp_metadata: false,
  xmp_metadata: {}
};

describe("metadata rules", () => {
  it("keeps clean metadata low risk", () => {
    const findings = buildFindings(baseMetadata);
    expect(findings).toEqual([]);
    expect(scoreFindings(findings)).toEqual({ score: 0, level: "Low" });
  });

  it("keeps missing author alone low", () => {
    const findings = buildFindings({ ...baseMetadata, author: null });
    expect(findings.map((finding) => finding.id)).toEqual(["missing-author"]);
    expect(scoreFindings(findings).level).toBe("Low");
  });

  it("detects modified date before created date as a strong signal", () => {
    const findings = buildFindings({
      ...baseMetadata,
      created_date: "2026-04-02T10:00:00.000Z",
      modified_date: "2026-04-01T10:00:00.000Z"
    });
    expect(findings.some((finding) => finding.id === "modified-before-created")).toBe(true);
    expect(scoreFindings(findings).level).toBe("High");
  });

  it("does not escalate multiple weak software signals to high", () => {
    const findings = buildFindings({
      ...baseMetadata,
      author: null,
      creator: "Canva",
      producer: "Adobe Acrobat"
    });
    const result = scoreFindings(findings);
    expect(result.score).toBeLessThanOrEqual(55);
    expect(result.level).toBe("Medium");
  });

  it("detects incremental update markers", () => {
    const findings = buildFindings({ ...baseMetadata, eof_marker_count: 2, startxref_count: 2 });
    expect(findings.some((finding) => finding.id === "incremental-update-indicators")).toBe(true);
  });
});
