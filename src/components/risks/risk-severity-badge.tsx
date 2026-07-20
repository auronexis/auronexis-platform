import type { RiskSeverity } from "@/types/database";
import { RISK_SEVERITY_LABELS } from "@/lib/risks/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const severityTones: Record<RiskSeverity, StatusBadgeTone> = {
  low: "muted",
  medium: "info",
  high: "warning",
  critical: "danger",
};

type RiskSeverityBadgeProps = {
  severity: RiskSeverity;
  className?: string;
};

export function RiskSeverityBadge({ severity, className }: RiskSeverityBadgeProps) {
  return (
    <StatusBadge tone={severityTones[severity]} className={className}>
      {RISK_SEVERITY_LABELS[severity]}
    </StatusBadge>
  );
}
