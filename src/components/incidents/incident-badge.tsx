import type { IncidentSeverity, IncidentStatus } from "@/types/database";
import {
  INCIDENT_SEVERITY_LABELS,
  INCIDENT_STATUS_LABELS,
} from "@/lib/incidents/types";
import { cn } from "@/lib/utils/cn";

const severityStyles: Record<IncidentSeverity, string> = {
  low: "bg-muted/10 text-muted ring-border/20",
  medium: "bg-blue-50 text-accent-blue ring-blue-600/20",
  high: "bg-amber-50 text-warning ring-amber-600/20",
  critical: "bg-red-50 text-critical ring-red-600/20",
};

const statusStyles: Record<IncidentStatus, string> = {
  open: "bg-blue-50 text-accent-blue ring-blue-600/20",
  investigating: "bg-amber-50 text-warning ring-amber-600/20",
  resolved: "bg-green-50 text-success ring-green-600/20",
  archived: "bg-muted/10 text-muted ring-border/20",
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
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
          severityStyles[props.value],
          props.className,
        )}
      >
        {INCIDENT_SEVERITY_LABELS[props.value]}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[props.value],
        props.className,
      )}
    >
      {INCIDENT_STATUS_LABELS[props.value]}
    </span>
  );
}

/** @deprecated Use IncidentBadge with kind="severity" */
export function IncidentSeverityBadge({
  severity,
  className,
}: {
  severity: IncidentSeverity;
  className?: string;
}) {
  return <IncidentBadge kind="severity" value={severity} className={className} />;
}

/** @deprecated Use IncidentBadge with kind="status" */
export function IncidentStatusBadge({
  status,
  className,
}: {
  status: IncidentStatus;
  className?: string;
}) {
  return <IncidentBadge kind="status" value={status} className={className} />;
}
