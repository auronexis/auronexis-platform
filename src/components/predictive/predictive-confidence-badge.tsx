import type { PredictiveConfidence } from "@/lib/predictive/types";
import { cn } from "@/lib/utils/cn";

type PredictiveConfidenceBadgeProps = {
  confidence: PredictiveConfidence | number;
  className?: string;
};

export function PredictiveConfidenceBadge({ confidence, className }: PredictiveConfidenceBadgeProps) {
  const score = typeof confidence === "number" ? confidence : confidence.score;
  const label = typeof confidence === "number" ? `${score}%` : `${score}% · ${confidence.label}`;

  const tone =
    score >= 70 ? "text-success" : score >= 45 ? "text-warning" : "text-danger";

  return (
    <span className={cn("text-xs font-medium", tone, className)}>
      Confidence {label}
    </span>
  );
}
