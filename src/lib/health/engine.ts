import type {
  HealthCalculationInput,
  HealthCalculationResult,
  HealthBreakdown,
  HealthBreakdownItem,
} from "@/lib/health/types";
import { scoreToHealthStatus } from "@/lib/health/types";

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function buildReason(penalties: HealthBreakdownItem[], bonuses: HealthBreakdownItem[]): string {
  const primaryPenalty = penalties.sort((a, b) => a.points - b.points)[0];
  if (primaryPenalty) {
    return primaryPenalty.label;
  }

  const primaryBonus = bonuses.sort((a, b) => b.points - a.points)[0];
  if (primaryBonus) {
    return primaryBonus.label;
  }

  return "Stable operational posture";
}

/** Deterministic health score from client signals — Sprint 8 engine. */
export function calculateHealth(input: HealthCalculationInput): HealthCalculationResult {
  const penalties: HealthBreakdownItem[] = [];
  const bonuses: HealthBreakdownItem[] = [];
  const { metrics } = input;

  if (metrics.slaViolations > 0) {
    penalties.push({
      label:
        metrics.slaViolations === 1
          ? "1 SLA violation"
          : `${metrics.slaViolations} SLA violations`,
      points: metrics.slaViolations * -10,
    });
  }

  if (metrics.isInactiveClient) {
    penalties.push({ label: "Inactive client", points: -5 });
  }

  if (metrics.missingReports) {
    penalties.push({ label: "Missing report", points: -5 });
  }

  if (metrics.portalDisabled) {
    penalties.push({ label: "Portal disabled", points: -5 });
  }

  if (metrics.noRecentActivity) {
    penalties.push({ label: "No recent activity", points: -3 });
  }

  if (metrics.healthySla) {
    bonuses.push({ label: "Healthy SLA", points: 2 });
  }

  if (metrics.portalEnabled) {
    bonuses.push({ label: "Portal enabled", points: 2 });
  }

  if (metrics.recentEngagement) {
    bonuses.push({ label: "Recent engagement", points: 3 });
  }

  const breakdown: HealthBreakdown = {
    baseScore: 100,
    penalties,
    bonuses,
  };

  const penaltyTotal = penalties.reduce((sum, item) => sum + item.points, 0);
  const bonusTotal = bonuses.reduce((sum, item) => sum + item.points, 0);
  const score = clampScore(100 + penaltyTotal + bonusTotal);
  const status = scoreToHealthStatus(score);
  const previousScore = input.previousScore ?? score;
  const delta = score - previousScore;
  const reason = buildReason(penalties, bonuses);

  return {
    score,
    status,
    delta,
    reason,
    breakdown,
  };
}
