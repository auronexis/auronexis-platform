import type { ClientRecoveryStatus } from "@/lib/customer-success/types";
import type { PlaybookInstanceRow } from "@/lib/customer-success/queries";

type RecoveryInput = {
  activeInstances: PlaybookInstanceRow[];
  healthScoreBefore: number | null;
  healthScoreAfter: number | null;
  hasRecentPositiveSignal: boolean;
};

export function resolveRecoveryStatus(input: RecoveryInput): ClientRecoveryStatus {
  const active = input.activeInstances.filter((i) =>
    ["active", "paused", "suggested"].includes(i.status),
  );

  if (active.length > 0) {
    if (
      input.healthScoreBefore !== null &&
      input.healthScoreAfter !== null &&
      input.healthScoreAfter > input.healthScoreBefore + 10
    ) {
      return "improving";
    }
    return "intervention_active";
  }

  const completed = input.activeInstances.filter((i) => i.status === "completed");
  if (completed.length === 0) {
    return input.healthScoreBefore === null ? "insufficient_data" : "not_started";
  }

  const latest = completed[0];
  if (
    latest?.recovery_score_before !== null &&
    latest?.recovery_score_after !== null &&
    latest.recovery_score_after >= latest.recovery_score_before + 15 &&
    input.hasRecentPositiveSignal
  ) {
    return "recovered";
  }

  if (
    latest?.recovery_score_before !== null &&
    latest?.recovery_score_after !== null &&
    latest.recovery_score_after < latest.recovery_score_before
  ) {
    return "worsened";
  }

  return "unresolved";
}

export function computeRecoveryRate(
  completed: PlaybookInstanceRow[],
): number | null {
  const withScores = completed.filter(
    (i) => i.recovery_score_before !== null && i.recovery_score_after !== null,
  );
  if (withScores.length === 0) return null;
  const recovered = withScores.filter(
    (i) => (i.recovery_score_after ?? 0) >= (i.recovery_score_before ?? 0) + 15,
  ).length;
  return Math.round((recovered / withScores.length) * 100);
}
