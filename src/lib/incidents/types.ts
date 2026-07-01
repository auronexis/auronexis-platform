import type { Incident, IncidentSeverity, IncidentStatus } from "@/types/database";

export type IncidentWithRelations = Incident & {
  clients: { name: string } | null;
  users: { full_name: string } | null;
  risks: { title: string } | null;
  client_risks: { title: string } | null;
};

export type CriticalIncidentAlert = Pick<
  Incident,
  "id" | "title" | "severity" | "status" | "due_at"
> & {
  clients: { name: string } | null;
};

export type RiskOption = {
  id: string;
  title: string;
  client_id: string;
};

export type IncidentSummary = {
  openCount: number;
  criticalCount: number;
  investigatingCount: number;
  resolvedCount: number;
  mttrHours: number | null;
  resolvedPercent: number;
};

export type IncidentActivityView = {
  id: string;
  organization_id: string;
  incident_id: string;
  actor_user_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor: { full_name: string } | null;
};

export const INCIDENT_SEVERITIES: IncidentSeverity[] = ["low", "medium", "high", "critical"];

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "open",
  "investigating",
  "resolved",
  "archived",
];

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  archived: "Archived",
};

/** Statuses staff may set when creating or updating assigned incidents. */
export const STAFF_INCIDENT_STATUSES: IncidentStatus[] = ["open", "investigating"];

export const OPEN_INCIDENT_STATUSES: IncidentStatus[] = ["open", "investigating"];

export const INCIDENT_SELECT_COLUMNS =
  "id, organization_id, client_id, risk_id, client_risk_id, title, description, severity, status, assigned_user_id, occurred_at, due_at, resolution_notes, resolved_at, created_at, updated_at";

export const INCIDENT_LIST_SELECT = `
  ${INCIDENT_SELECT_COLUMNS},
  clients ( name ),
  users ( full_name ),
  risks ( title ),
  client_risks ( title )
`;

export function getIncidentLinkedRiskId(
  incident: Pick<IncidentWithRelations, "client_risk_id" | "risk_id">,
): string | null {
  return incident.client_risk_id ?? incident.risk_id;
}

export function getIncidentLinkedRiskTitle(incident: IncidentWithRelations): string | null {
  return incident.client_risks?.title ?? incident.risks?.title ?? null;
}

export function formatIncidentDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatIncidentDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}
