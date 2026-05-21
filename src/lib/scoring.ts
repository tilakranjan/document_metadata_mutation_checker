import type { Finding, RiskLevel } from "@/types/report";

const severityWeight: Record<Finding["severity"], number> = {
  Low: 10,
  Medium: 30,
  High: 55
};

export function scoreFindings(findings: Finding[]) {
  if (findings.length === 0) return { score: 0, level: "Low" as RiskLevel };

  const rawScore = findings.reduce((sum, finding) => sum + severityWeight[finding.severity] * finding.confidence, 0);
  const relatedBoost = relatedFindingBoost(findings);
  const hasStrongSignal = findings.some((finding) => finding.signal_strength === "strong" || finding.severity === "High");
  const hasOnlyWeakCommonSignals = findings.every((finding) => finding.signal_strength === "weak");
  const cappedScore = hasOnlyWeakCommonSignals && !hasStrongSignal ? Math.min(rawScore + relatedBoost, 55) : rawScore + relatedBoost;
  const scoreFloor = findings.some((finding) => finding.severity === "High") ? 66 : 0;
  const weakClusterFloor = hasOnlyWeakCommonSignals && findings.length >= 3 ? 31 : 0;
  const score = Math.max(scoreFloor, weakClusterFloor, Math.max(0, Math.min(100, Math.round(cappedScore))));

  return { score, level: riskLevel(score) };
}

export function riskLevel(score: number): RiskLevel {
  if (score <= 30) return "Low";
  if (score <= 65) return "Medium";
  return "High";
}

function relatedFindingBoost(findings: Finding[]) {
  const categories = new Map<string, number>();
  for (const finding of findings) categories.set(finding.category, (categories.get(finding.category) ?? 0) + 1);
  return [...categories.values()].reduce((boost, count) => boost + (count > 1 ? Math.min(8, count * 2) : 0), 0);
}
