import type { PredictiveTrendLabel, PredictiveTrajectory } from "@/lib/predictive/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const TRAJECTORY_TONES: Record<PredictiveTrajectory, StatusBadgeTone> = {
  improving: "success",
  stable: "muted",
  declining: "warning",
  critical: "danger",
};

const TRAJECTORY_LABELS: Record<PredictiveTrajectory, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
  critical: "Critical",
};

const TREND_LABELS: Record<PredictiveTrendLabel, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
  critical: "Critical",
  unknown: "Unknown",
};

type PredictiveTrendBadgeProps = {
  value: PredictiveTrendLabel | PredictiveTrajectory;
  className?: string;
};

export function PredictiveTrendBadge({ value, className }: PredictiveTrendBadgeProps) {
  const trajectory = value === "unknown" ? "stable" : (value as PredictiveTrajectory);
  const label =
    value in TREND_LABELS ? TREND_LABELS[value as PredictiveTrendLabel] : TRAJECTORY_LABELS[trajectory];

  return (
    <StatusBadge tone={TRAJECTORY_TONES[trajectory] ?? "muted"} className={className}>
      {label}
    </StatusBadge>
  );
}
