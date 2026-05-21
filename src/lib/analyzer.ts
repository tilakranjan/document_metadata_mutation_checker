import { PDFDocument } from "pdf-lib";
import type { AnalysisReport, ExtractedMetadata } from "@/types/report";
import { inspectRawPdf } from "./rawPdf";
import { buildFindings } from "./rules";
import { scoreFindings } from "./scoring";
import { parsePdfDate, toReportDate } from "./pdfDate";

export interface AnalyzePdfInput {
  fileName: string;
  fileType?: string;
  bytes: Uint8Array;
}

export async function analyzePdf(input: AnalyzePdfInput): Promise<AnalysisReport> {
  if (!looksLikePdf(input.bytes)) {
    throw new Error("Only PDF files are supported in this version.");
  }

  const raw = inspectRawPdf(input.bytes);
  let pdfDoc: PDFDocument | null = null;
  let encryptionStatus: ExtractedMetadata["encryption_status"] = "unknown";

  try {
    pdfDoc = await PDFDocument.load(input.bytes, { ignoreEncryption: true, updateMetadata: false });
    encryptionStatus = pdfDoc.isEncrypted ? "encrypted" : "not_encrypted";
  } catch {
    encryptionStatus = "encrypted";
  }

  const created = parsePdfDate(pdfDoc?.getCreationDate());
  const modified = parsePdfDate(pdfDoc?.getModificationDate());
  const metadata: ExtractedMetadata = {
    file_name: input.fileName,
    file_size_bytes: input.bytes.byteLength,
    file_type: input.fileType || "application/pdf",
    pdf_version: raw.pdfVersion,
    created_date: toReportDate(created?.date ?? null),
    modified_date: toReportDate(modified?.date ?? null),
    author: nullable(pdfDoc?.getAuthor()),
    creator: nullable(pdfDoc?.getCreator()),
    producer: nullable(pdfDoc?.getProducer()),
    title: nullable(pdfDoc?.getTitle()),
    subject: nullable(pdfDoc?.getSubject()),
    page_count: pdfDoc?.getPageCount() ?? null,
    encryption_status: encryptionStatus,
    eof_marker_count: raw.eofMarkerCount,
    startxref_count: raw.startxrefCount,
    has_xmp_metadata: raw.hasXmpMetadata,
    xmp_metadata: raw.xmpMetadata
  };

  const findings = buildFindings(metadata);
  const { score, level } = scoreFindings(findings);

  return {
    document_name: input.fileName,
    file_type: metadata.file_type,
    metadata_risk_score: score,
    metadata_risk_level: level,
    summary: buildSummary(score, findings.length),
    extracted_metadata: metadata,
    findings,
    recommended_action: buildRecommendation(level)
  };
}

function looksLikePdf(bytes: Uint8Array) {
  return new TextDecoder("latin1").decode(bytes.slice(0, 8)).startsWith("%PDF-");
}

function nullable(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function buildSummary(score: number, findingCount: number) {
  if (findingCount === 0) {
    return "No notable metadata mutation indicators were found. This does not independently prove document authenticity.";
  }
  if (score <= 30) {
    return "The document contains low-risk metadata indicators. These signals are common and should be interpreted with context.";
  }
  if (score <= 65) {
    return "The document contains metadata indicators that may suggest post-creation editing or conversion. These findings should be reviewed with additional evidence.";
  }
  return "The document contains multiple or stronger metadata indicators that warrant review with supporting evidence and document context.";
}

function buildRecommendation(level: string) {
  if (level === "High") {
    return "Review the document manually, compare it against source records if available, and consider specialist review for high-value or sensitive workflows.";
  }
  if (level === "Medium") {
    return "Review the findings manually if the document is part of a high-value or sensitive process.";
  }
  return "Keep the report with the document record and review manually only if business context requires it.";
}
