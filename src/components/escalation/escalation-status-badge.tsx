import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

type EscalationStatusBadgeProps = {
  status: "warning" | "critical" | "escalated" | "acknowledged";
  className?: string;
};

const statusTones: Record<EscalationStatusBadgeProps["status"], StatusBadgeTone> = {
  warning: "warning",
  critical: "danger",
  escalated: "violet",
  acknowledged: "success",
};

const statusLabels: Record<EscalationStatusBadgeProps["status"], string> = {
  warning: "Warning",
  critical: "Critical",
  escalated: "Escalated",
  acknowledged: "Acknowledged",
};

export function EscalationStatusBadge({ status, className }: EscalationStatusBadgeProps) {
  return (
    <StatusBadge tone={statusTones[status]} className={className}>
      {statusLabels[status]}
    </StatusBadge>
  );
}
