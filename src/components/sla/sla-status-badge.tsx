import type { SlaStatus } from "@/lib/sla/calculations";
import { SLA_STATUS_LABELS } from "@/lib/sla/types";
import { cn } from "@/lib/utils/cn";

const statusStyles: Record<Exclude<SlaStatus, null>, string> = {
  on_track: "bg-green-50 text-success ring-green-600/20",
  warning: "bg-amber-50 text-warning ring-amber-600/25",
  breached: "bg-red-50 text-red-700 ring-red-600/25",
};

type SlaStatusBadgeProps = {
  status: SlaStatus;
  className?: string;
};

export function SlaStatusBadge({ status, className }: SlaStatusBadgeProps) {
  if (!status) {
    return <span className={cn("text-sm text-muted", className)}>—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      {SLA_STATUS_LABELS[status]}
    </span>
  );
}
