/**
 * Pure workspace compliance maturity formulas (no I/O).
 *
 * These scores measure TENANT / WORKSPACE maturity only — not platform health,
 * not SOC 2 / ISO 27001 / GDPR / NIS2 / DORA / HIPAA certification.
 */

import type { GovernanceControlKey, ReadinessLevel } from "@/lib/compliance/types";

export type MaturityFormulaInput = {
  retentionCoveragePercent: number;
  activePolicies: number;
  auditEventsTotal: number;
  auditGrowth7d: number;
  /** Mean of tenant control scores (0–100). */
  controlAverage: number;
};

export type MaturityFormulaResult = {
  /** Composite workspace compliance maturity (0–100). */
  readinessPercent: number;
  maturityScore: number;
  readinessLevel: ReadinessLevel;
};

/**
 * Workspace compliance maturity:
 *   retentionCoverage * 0.2
 * + min(activePolicies * 10, 30)
 * + (auditEventsTotal > 0 ? 20 : 0)
 * + (auditGrowth7d > 0 ? 5 : 0)
 * + controlAverage * 0.3
 */
export function computeWorkspaceComplianceMaturity(
  input: MaturityFormulaInput,
): MaturityFormulaResult {
  const readinessPercent = Math.min(
    100,
    Math.round(
      input.retentionCoveragePercent * 0.2 +
        Math.min(input.activePolicies * 10, 30) +
        (input.auditEventsTotal > 0 ? 20 : 0) +
        (input.auditGrowth7d > 0 ? 5 : 0) +
        input.controlAverage * 0.3,
    ),
  );

  const maturityScore = Math.min(
    100,
    Math.round((readinessPercent + input.controlAverage) / 2),
  );

  const readinessLevel: ReadinessLevel =
    maturityScore >= 85
      ? "optimized"
      : maturityScore >= 70
        ? "managed"
        : maturityScore >= 45
          ? "developing"
          : "initial";

  return { readinessPercent, maturityScore, readinessLevel };
}

export function averageControlScores(scores: ReadonlyArray<{ score: number }>): number {
  if (scores.length === 0) return 0;
  return scores.reduce((sum, item) => sum + item.score, 0) / scores.length;
}

export function averageFrameworkControlScores(scores: ReadonlyArray<{ score: number }>): number {
  if (scores.length === 0) return 0;
  return Math.round(averageControlScores(scores));
}

/**
 * A control counts as implemented for framework cards only when it has
 * tenant-backed evidence and is not in fail status.
 */
export function countImplementedControlsWithEvidence(
  frameworkControls: ReadonlyArray<GovernanceControlKey>,
  scores: ReadonlyArray<{
    control: GovernanceControlKey;
    status: "pass" | "partial" | "fail";
    evidenceAvailable: boolean;
  }>,
): number {
  return frameworkControls.filter((control) =>
    scores.some(
      (score) =>
        score.control === control && score.evidenceAvailable && score.status !== "fail",
    ),
  ).length;
}

/** Platform capability: schema/tables reachable → 100; otherwise 0. Not tenant maturity. */
export function computeCompliancePlatformCapabilityPercent(tablesReachable: boolean): number {
  return tablesReachable ? 100 : 0;
}

/** Go-live / production readiness uses platform availability only. */
export function computeComplianceProductionReadinessScore(tablesReachable: boolean): number {
  return tablesReachable ? 90 : 40;
}
