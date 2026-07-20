import type { SlaStatus } from "@/lib/sla/calculations";
import { SLA_STATUS_LABELS } from "@/lib/sla/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const statusTones: Record<Exclude<SlaStatus, null>, StatusBadgeTone> = {
  on_track: "success",
  warning: "warning",
  breached: "danger",
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
    <StatusBadge tone={statusTones[status]} className={className}>
      {SLA_STATUS_LABELS[status]}
    </StatusBadge>
  );
}
