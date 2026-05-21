import type { ExtractedMetadata, Finding } from "@/types/report";
import { parsePdfDate } from "./pdfDate";

const DAY_MS = 24 * 60 * 60 * 1000;
const SIGNIFICANT_MODIFICATION_DAYS = 7;
const editingTools = [
  "preview",
  "acrobat",
  "photoshop",
  "illustrator",
  "canva",
  "online pdf editor",
  "scanner",
  "scan"
];

export function buildFindings(metadata: ExtractedMetadata): Finding[] {
  const findings: Finding[] = [];
  const created = parsePdfDate(metadata.created_date);
  const modified = parsePdfDate(metadata.modified_date);

  if (!created && !modified) {
    findings.push(finding("missing-document-dates", "Created and modified dates are missing", "Medium", 0.62, "date", "moderate", "The PDF document information does not expose creation or modification timestamps.", "The file does not include the usual date fields, which can happen naturally but reduces traceability."));
  } else if (!created && modified) {
    findings.push(finding("modified-date-without-created-date", "Modified date exists without created date", "Medium", 0.72, "date", "moderate", "The PDF exposes a modification timestamp but no creation timestamp.", "The file records when it was changed, but not when it was first created."));
  }

  for (const [id, label, parsed] of [
    ["invalid-created-date", "Created date has an invalid or unusual format", created],
    ["invalid-modified-date", "Modified date has an invalid or unusual format", modified]
  ] as const) {
    if (parsed && (!parsed.isValid || parsed.isUnusualFormat)) {
      findings.push(finding(id, label, parsed.isValid ? "Low" : "Medium", parsed.isValid ? 0.45 : 0.68, "date", parsed.isValid ? "weak" : "moderate", `The raw metadata value "${parsed.raw}" does not follow the standard PDF date pattern.`, "A date field uses an uncommon format. This may be harmless, but it is worth reviewing."));
    }
  }

  if (created?.date && modified?.date) {
    const deltaDays = (modified.date.getTime() - created.date.getTime()) / DAY_MS;
    if (deltaDays < 0) {
      findings.push(finding("modified-before-created", "Modified date is earlier than created date", "High", 0.86, "date", "strong", "The modification timestamp is before the creation timestamp.", "The file timeline is inconsistent and should be reviewed with additional evidence."));
    } else if (deltaDays > SIGNIFICANT_MODIFICATION_DAYS) {
      findings.push(finding("modified-significantly-after-created", "Document modified significantly after creation", "Medium", 0.74, "date", "moderate", `The modification timestamp is ${Math.round(deltaDays)} days after the creation timestamp.`, "The file appears to have been changed well after creation. This may reflect normal editing, export, or conversion."));
    }
  }

  const creator = normalize(metadata.creator);
  const producer = normalize(metadata.producer);
  if (creator && producer && creator !== producer) {
    findings.push(finding("creator-producer-mismatch", "Creator and producer fields differ", "Low", 0.6, "software", "weak", "The creator and producer metadata fields identify different tools.", "The document may have been created in one application and exported or processed by another. This is common and not proof of a problem."));
  }

  const toolText = [metadata.creator, metadata.producer].filter(Boolean).join(" ").toLowerCase();
  const matchedTools = editingTools.filter((tool) => toolText.includes(tool));
  if (matchedTools.length > 0) {
    findings.push(finding("editing-export-tool-signal", "Editing or export tool appears in metadata", "Low", 0.52, "software", "weak", `Metadata references common editing/export software: ${[...new Set(matchedTools)].join(", ")}.`, "The file appears to have passed through common document software. This is a signal to review, not a conclusion."));
  }

  if (!metadata.author || !metadata.author.trim()) {
    findings.push(finding("missing-author", "Author metadata is missing", "Low", 0.4, "metadata", "weak", "The PDF author metadata field is empty.", "Many documents omit author information, so this is a weak signal by itself."));
  }

  if (metadata.eof_marker_count > 1 || metadata.startxref_count > 1) {
    findings.push(finding("incremental-update-indicators", "PDF contains incremental update indicators", "Medium", 0.78, "structure", "strong", `The raw PDF contains ${metadata.eof_marker_count} EOF markers and ${metadata.startxref_count} startxref markers.`, "The file structure suggests it may have been saved in multiple passes. This can be normal, but it is useful evidence to review."));
  }

  findings.push(...xmpMismatchFindings(metadata));
  return findings;
}

function xmpMismatchFindings(metadata: ExtractedMetadata): Finding[] {
  if (!metadata.has_xmp_metadata) return [];
  const pairs = [
    ["created_date", metadata.created_date, metadata.xmp_metadata.created_date],
    ["modified_date", metadata.modified_date, metadata.xmp_metadata.modified_date],
    ["creator", metadata.creator, metadata.xmp_metadata.creator],
    ["producer", metadata.producer, metadata.xmp_metadata.producer],
    ["title", metadata.title, metadata.xmp_metadata.title]
  ] as const;

  return pairs
    .filter(([, infoValue, xmpValue]) => infoValue && xmpValue && normalize(infoValue) !== normalize(xmpValue))
    .map(([field, infoValue, xmpValue]) =>
      finding(`xmp-${field}-mismatch`, `XMP and document info ${field.replace("_", " ")} differ`, "Medium", 0.72, "metadata", "moderate", `Document info has "${infoValue}" while XMP has "${xmpValue}".`, "Two metadata sources inside the PDF disagree. This should be reviewed with the document context.")
    );
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function finding(
  id: string,
  title: string,
  severity: Finding["severity"],
  confidence: number,
  category: Finding["category"],
  signal_strength: Finding["signal_strength"],
  technical_explanation: string,
  simple_explanation: string
): Finding {
  return { id, title, severity, confidence, category, signal_strength, technical_explanation, simple_explanation };
}
