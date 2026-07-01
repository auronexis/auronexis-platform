export type RiskScoreLevel = "low" | "medium" | "high" | "critical";

/** risk_score = likelihood × impact (each 1–5). */
export function calculateRiskScore(likelihood: number, impact: number): number {
  const l = clampScoreDimension(likelihood);
  const i = clampScoreDimension(impact);
  return l * i;
}

export function clampScoreDimension(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

/** Map composite score (1–25) to a risk level band. */
export function getRiskLevelFromScore(score: number): RiskScoreLevel {
  if (score >= 20) {
    return "critical";
  }

  if (score >= 12) {
    return "high";
  }

  if (score >= 6) {
    return "medium";
  }

  return "low";
}

export const RISK_SCORE_LEVEL_LABELS: Record<RiskScoreLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function getRiskScoreLevelLabel(score: number): string {
  return RISK_SCORE_LEVEL_LABELS[getRiskLevelFromScore(score)];
}

/** Suggest severity from score when auto-syncing severity badges. */
export function severityFromRiskScore(score: number): "low" | "medium" | "high" | "critical" {
  return getRiskLevelFromScore(score);
}
