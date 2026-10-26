import type { ClientHealth } from "@/lib/profitability/types";
import { MARGIN_STATUS_LABELS } from "@/lib/profitability/types";
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

/** Margin status of a client (profitability), labelled so it is not mistaken for client health. */
export function ClientHealthBadge({ health, className }: ClientHealthBadgeProps) {
  return (
    <StatusBadge tone={healthTones[health]} className={className}>
      {MARGIN_STATUS_LABELS[health]}
    </StatusBadge>
  );
}
