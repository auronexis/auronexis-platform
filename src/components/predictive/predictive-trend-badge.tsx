import type { PredictiveTrendLabel, PredictiveTrajectory } from "@/lib/predictive/types";
import { cn } from "@/lib/utils/cn";

const TRAJECTORY_STYLES: Record<PredictiveTrajectory, string> = {
  improving: "border-success/30 bg-success/10 text-success",
  stable: "border-border bg-surface/80 text-muted",
  declining: "border-warning/30 bg-warning/10 text-warning",
  critical: "border-danger/30 bg-danger/10 text-danger",
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
  const label = value in TREND_LABELS ? TREND_LABELS[value as PredictiveTrendLabel] : TRAJECTORY_LABELS[trajectory];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TRAJECTORY_STYLES[trajectory] ?? TRAJECTORY_STYLES.stable,
        className,
      )}
    >
      {label}
    </span>
  );
}
