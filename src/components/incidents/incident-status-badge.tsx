import type { IncidentStatus } from "@/types/database";
import { INCIDENT_STATUS_LABELS } from "@/lib/incidents/types";
import { cn } from "@/lib/utils/cn";

const statusStyles: Record<IncidentStatus, string> = {
  open: "bg-blue-50 text-accent-blue ring-blue-600/20",
  investigating: "bg-amber-50 text-warning ring-amber-600/20",
  resolved: "bg-green-50 text-success ring-green-600/20",
  archived: "bg-muted/10 text-muted ring-border/20",
};

type IncidentStatusBadgeProps = {
  status: IncidentStatus;
  className?: string;
};

export function IncidentStatusBadge({ status, className }: IncidentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      {INCIDENT_STATUS_LABELS[status]}
    </span>
  );
}
