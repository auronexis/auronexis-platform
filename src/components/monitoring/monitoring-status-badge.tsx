import type { MonitoringConnectorStatus } from "@/lib/monitoring/types";
import { MONITORING_STATUS_LABELS } from "@/lib/monitoring/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const toneMap: Record<MonitoringConnectorStatus, StatusBadgeTone> = {
  active: "success",
  paused: "warning",
  failed: "danger",
  disabled: "muted",
  archived: "muted",
};

type MonitoringStatusBadgeProps = {
  status: MonitoringConnectorStatus | string;
  className?: string;
};

export function MonitoringStatusBadge({ status, className }: MonitoringStatusBadgeProps) {
  const normalized = status as MonitoringConnectorStatus;
  const label = MONITORING_STATUS_LABELS[normalized] ?? status;

  return (
    <StatusBadge
      tone={toneMap[normalized] ?? "muted"}
      className={className}
    >
      {label}
    </StatusBadge>
  );
}
