import type { RiskStatus } from "@/lib/risks/types";
import { getRiskStatusLabel } from "@/lib/risks/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const statusTones: Record<RiskStatus, StatusBadgeTone> = {
  open: "info",
  acknowledged: "warning",
  mitigated: "violet",
  resolved: "success",
  dismissed: "muted",
};

type RiskStatusBadgeProps = {
  status: RiskStatus;
  className?: string;
};

export function RiskStatusBadge({ status, className }: RiskStatusBadgeProps) {
  return (
    <StatusBadge tone={statusTones[status]} className={className}>
      {getRiskStatusLabel(status)}
    </StatusBadge>
  );
}
