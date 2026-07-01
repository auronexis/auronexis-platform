import type { RiskStatus } from "@/lib/risks/types";
import { RISK_STATUS_LABELS } from "@/lib/risks/types";
import { cn } from "@/lib/utils/cn";

const statusStyles: Record<RiskStatus, string> = {
  open: "bg-blue-50 text-accent-blue ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-200",
  acknowledged: "bg-amber-50 text-warning ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-200",
  mitigated: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-200",
  resolved: "bg-green-50 text-success ring-green-600/20 dark:bg-green-950/40 dark:text-green-200",
  dismissed: "bg-muted/10 text-muted ring-border/20",
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
