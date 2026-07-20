import type { RetentionRiskLevel } from "@/lib/adoption/types";
import { RETENTION_RISK_LABELS } from "@/lib/adoption/constants";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const RISK_TONES: Record<RetentionRiskLevel, StatusBadgeTone> = {
  healthy: "success",
  watch: "warning",
  at_risk: "danger",
  critical: "danger",
  unknown: "muted",
};

type AdoptionRiskBadgeProps = {
  level: RetentionRiskLevel;
  className?: string;
};

export function AdoptionRiskBadge({ level, className }: AdoptionRiskBadgeProps) {
  return (
    <StatusBadge
      tone={RISK_TONES[level]}
      className={className}
      aria-label={`Retention risk: ${RETENTION_RISK_LABELS[level]}`}
    >
      {RETENTION_RISK_LABELS[level]}
    </StatusBadge>
  );
}
