import type { RiskStatus } from "@/types/database";
import { RISK_STATUS_LABELS } from "@/lib/risks/types";
import { cn } from "@/lib/utils/cn";

const statusStyles: Record<RiskStatus, string> = {
  open: "bg-blue-50 text-accent-blue ring-blue-600/20",
  in_progress: "bg-amber-50 text-warning ring-amber-600/20",
  resolved: "bg-green-50 text-success ring-green-600/20",
  archived: "bg-muted/10 text-muted ring-border/20",
};

type RiskStatusBadgeProps = {
  status: RiskStatus;
  className?: string;
};

export function RiskStatusBadge({ status, className }: RiskStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      {RISK_STATUS_LABELS[status]}
    </span>
  );
}
