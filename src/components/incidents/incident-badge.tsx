import type { IncidentSeverity, IncidentStatus } from "@/types/database";
import {
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
} from "@/lib/incidents/types";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const severityTones: Record<IncidentSeverity, StatusBadgeTone> = {
  low: "muted",
  medium: "info",
  high: "warning",
  critical: "danger",
};

const statusTones: Record<IncidentStatus, StatusBadgeTone> = {
  open: "info",
  investigating: "warning",
  resolved: "success",
  archived: "muted",
};

type IncidentBadgeProps =
  | {
      kind: "severity";
      value: IncidentSeverity;
      className?: string;
    }
  | {
      kind: "status";
      value: IncidentStatus;
      className?: string;
    };

export function IncidentBadge(props: IncidentBadgeProps) {
  if (props.kind === "severity") {
    return (
      <StatusBadge tone={severityTones[props.value]} className={props.className}>
        {INCIDENT_SEVERITY_LABELS[props.value]}
      </StatusBadge>
    );
  }

  return (
    <StatusBadge tone={statusTones[props.value]} className={props.className}>
      {INCIDENT_STATUS_LABELS[props.value]}
    </StatusBadge>
  );
}

export function IncidentSeverityBadge({
  severity,
  className,
}: {
  severity: IncidentSeverity;
  className?: string;
}) {
  return <IncidentBadge kind="severity" value={severity} className={className} />;
}

export function IncidentStatusBadge({
  status,
  className,
}: {
  status: IncidentStatus;
  className?: string;
}) {
  return <IncidentBadge kind="status" value={status} className={className} />;
}
