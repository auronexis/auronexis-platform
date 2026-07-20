import type { ClientHealth } from "@/lib/profitability/types";
import { CLIENT_HEALTH_LABELS } from "@/lib/profitability/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const healthTones: Record<ClientHealth, StatusBadgeTone> = {
  healthy: "success",
  watch: "warning",
  critical: "danger",
};

type ClientHealthBadgeProps = {
  health: ClientHealth;
  className?: string;
};

export function ClientHealthBadge({ health, className }: ClientHealthBadgeProps) {
  return (
    <StatusBadge tone={healthTones[health]} className={className}>
      {CLIENT_HEALTH_LABELS[health]}
    </StatusBadge>
  );
}
