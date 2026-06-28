import { cn } from "@/lib/utils/cn";

type EscalationStatusBadgeProps = {
  status: "warning" | "critical" | "escalated" | "acknowledged";
  className?: string;
};

const statusStyles: Record<EscalationStatusBadgeProps["status"], string> = {
  warning: "bg-amber-50 text-warning ring-amber-600/25",
  critical: "bg-red-50 text-red-700 ring-red-600/25",
  escalated: "bg-violet-50 text-violet-700 ring-violet-600/25",
  acknowledged: "bg-green-50 text-success ring-green-600/20",
};

const statusLabels: Record<EscalationStatusBadgeProps["status"], string> = {
  warning: "Warning",
  critical: "Critical",
  escalated: "Escalated",
  acknowledged: "Acknowledged",
};

export function EscalationStatusBadge({ status, className }: EscalationStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
