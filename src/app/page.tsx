"use client";

import { useMemo, useState } from "react";
import type { AnalysisReport } from "@/types/report";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const jsonReport = useMemo(() => (report ? JSON.stringify(report, null, 2) : ""), [report]);

  async function analyze() {
    if (!file) return;
    setIsLoading(true);
    setError(null);
    setReport(null);

    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/analyze", { method: "POST", body: form });
    const payload = await response.json();

    setIsLoading(false);
    if (!response.ok) {
      setError(payload.error || "Unable to analyze this file.");
      return;
    }
    setReport(payload);
  }

  function downloadJson() {
    if (!report) return;
    const url = URL.createObjectURL(new Blob([jsonReport], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.document_name}.metadata-report.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <section className="intro">
        <div>
          <p className="eyebrow">PDF metadata analysis</p>
          <h1>Document Metadata Mutation Checker</h1>
          <p className="lede">
            Upload a PDF to extract document metadata, inspect common mutation indicators, and generate a careful risk report.
          </p>
        </div>
      </section>

      <section className="workspace">
        <div className="upload-panel">
          <label className="dropzone">
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <span>{file ? file.name : "Choose a PDF file"}</span>
            <small>{file ? `${Math.round(file.size / 1024)} KB` : "PDF only for this version"}</small>
          </label>
          <button className="primary" disabled={!file || isLoading} onClick={analyze}>
            {isLoading ? "Analyzing..." : "Analyze PDF"}
          </button>
          {error ? <p className="error">{error}</p> : null}
        </div>

        {report ? (
          <div className="report">
            <div className="score-row">
              <div>
                <p className="eyebrow">Overall risk</p>
                <h2>{report.metadata_risk_level}</h2>
              </div>
              <div className="score">{report.metadata_risk_score}</div>
            </div>
            <p className="summary">{report.summary}</p>

            <div className="meta-grid">
              {Object.entries(report.extracted_metadata).map(([key, value]) => (
                <div key={key}>
                  <span>{key.replaceAll("_", " ")}</span>
                  <strong>{formatValue(value)}</strong>
                </div>
              ))}
            </div>

            <div className="findings-header">
              <h3>Findings</h3>
              <button onClick={downloadJson}>Download JSON</button>
            </div>
            <div className="findings">
              {report.findings.length === 0 ? (
                <p>No notable findings.</p>
              ) : (
                report.findings.map((finding) => (
                  <article key={finding.id} className="finding">
                    <div>
                      <h4>{finding.title}</h4>
                      <span>{finding.category} · {finding.severity} · confidence {finding.confidence}</span>
                    </div>
                    <p>{finding.simple_explanation}</p>
                    <details>
                      <summary>Technical explanation</summary>
                      <p>{finding.technical_explanation}</p>
                    </details>
                  </article>
                ))
              )}
            </div>
            <div className="recommendation">
              <span>Recommended action</span>
              <p>{report.recommended_action}</p>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h2>Report output</h2>
            <p>The analysis report will appear here after upload.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not present";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
