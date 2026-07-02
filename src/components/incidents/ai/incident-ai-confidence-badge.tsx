import { confidenceLabel } from "@/lib/ai-incidents/types";
import { cn } from "@/lib/utils/cn";

type IncidentAIConfidenceBadgeProps = {
  confidence: number | null | undefined;
  className?: string;
};

export function IncidentAIConfidenceBadge({ confidence, className }: IncidentAIConfidenceBadgeProps) {
  const label = confidenceLabel(confidence);
  const tone =
    confidence != null && confidence >= 0.85
      ? "success"
      : confidence != null && confidence >= 0.65
        ? "warning"
        : "neutral";

  const toneStyles = {
    success: "border-success/20 bg-success/10 text-success",
    warning: "border-warning/20 bg-warning/10 text-warning",
    neutral: "border-border bg-muted/10 text-muted",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        toneStyles[tone],
        className,
      )}
    >
      {label} confidence{confidence != null ? ` (${Math.round(confidence * 100)}%)` : ""}
    </span>
  );
}
