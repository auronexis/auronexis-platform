import type { RiskSeverity } from "@/types/database";
import { RISK_SEVERITY_LABELS } from "@/lib/risks/types";
import { cn } from "@/lib/utils/cn";

const severityStyles: Record<RiskSeverity, string> = {
  low: "bg-muted/10 text-muted ring-border/20",
  medium: "bg-blue-50 text-accent-blue ring-blue-600/20",
  high: "bg-amber-50 text-warning ring-amber-600/20",
  critical: "bg-red-50 text-critical ring-red-600/20",
};

type RiskSeverityBadgeProps = {
  severity: RiskSeverity;
  className?: string;
};

export function RiskSeverityBadge({ severity, className }: RiskSeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        severityStyles[severity],
        className,
      )}
    >
      {RISK_SEVERITY_LABELS[severity]}
    </span>
  );
}
