export type Severity = "Low" | "Medium" | "High";
export type RiskLevel = "Low" | "Medium" | "High";
export type FindingCategory = "date" | "software" | "metadata" | "structure";

export interface ExtractedMetadata {
  file_name: string;
  file_size_bytes: number;
  file_type: string;
  pdf_version: string | null;
  created_date: string | null;
  modified_date: string | null;
  author: string | null;
  creator: string | null;
  producer: string | null;
  title: string | null;
  subject: string | null;
  page_count: number | null;
  encryption_status: "encrypted" | "not_encrypted" | "unknown";
  eof_marker_count: number;
  startxref_count: number;
  has_xmp_metadata: boolean;
  xmp_metadata: Partial<Record<"created_date" | "modified_date" | "creator" | "producer" | "title", string>>;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  confidence: number;
  category: FindingCategory;
  technical_explanation: string;
  simple_explanation: string;
  signal_strength: "weak" | "moderate" | "strong";
}

export interface AnalysisReport {
  document_name: string;
  file_type: string;
  metadata_risk_score: number;
  metadata_risk_level: RiskLevel;
  summary: string;
  extracted_metadata: ExtractedMetadata;
  findings: Finding[];
  recommended_action: string;
}
