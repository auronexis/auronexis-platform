import type { RetentionRiskLevel } from "@/lib/adoption/types";
import { RETENTION_RISK_LABELS } from "@/lib/adoption/constants";
import { cn } from "@/lib/utils/cn";

const RISK_TONES: Record<RetentionRiskLevel, string> = {
  healthy: "bg-success/10 text-success border-success/20",
  watch: "bg-warning/10 text-warning border-warning/20",
  at_risk: "bg-danger/10 text-danger border-danger/20",
  critical: "bg-danger/15 text-danger border-danger/30",
  unknown: "bg-muted/15 text-muted border-border",
};

type AdoptionRiskBadgeProps = {
  level: RetentionRiskLevel;
  className?: string;
};

export function AdoptionRiskBadge({ level, className }: AdoptionRiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        RISK_TONES[level],
        className,
      )}
      aria-label={`Retention risk: ${RETENTION_RISK_LABELS[level]}`}
    >
      {RETENTION_RISK_LABELS[level]}
    </span>
  );
}
