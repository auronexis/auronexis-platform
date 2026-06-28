import type { ClientHealth } from "@/lib/profitability/types";
import { CLIENT_HEALTH_LABELS } from "@/lib/profitability/types";
import { cn } from "@/lib/utils/cn";

const healthStyles: Record<ClientHealth, string> = {
  healthy: "bg-green-50 text-success ring-green-600/20",
  watch: "bg-amber-50 text-warning ring-amber-600/20",
  critical: "bg-red-50 text-critical ring-red-600/20",
};

type ClientHealthBadgeProps = {
  health: ClientHealth;
  className?: string;
};

export function ClientHealthBadge({ health, className }: ClientHealthBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        healthStyles[health],
        className,
      )}
    >
      {CLIENT_HEALTH_LABELS[health]}
    </span>
  );
}
