import type { MonitoringConnectorStatus } from "@/lib/monitoring/types";
import { MONITORING_STATUS_LABELS } from "@/lib/monitoring/types";
import { cn } from "@/lib/utils/cn";

const toneStyles: Record<MonitoringConnectorStatus, string> = {
  active: "border-success/20 bg-success/10 text-success",
  paused: "border-warning/20 bg-warning/10 text-warning",
  failed: "border-danger/20 bg-danger/10 text-danger",
  disabled: "border-border bg-muted/10 text-muted",
  archived: "border-border bg-muted/10 text-muted",
};

type MonitoringStatusBadgeProps = {
  status: MonitoringConnectorStatus | string;
  className?: string;
};

export function MonitoringStatusBadge({ status, className }: MonitoringStatusBadgeProps) {
  const normalized = status as MonitoringConnectorStatus;
  const label = MONITORING_STATUS_LABELS[normalized] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        toneStyles[normalized] ?? toneStyles.disabled,
        className,
      )}
    >
      {label}
    </span>
  );
}
