import type { Risk, RiskSeverity, RiskStatus } from "@/types/database";

export type RiskWithRelations = Risk & {
  clients: { name: string } | null;
  users: { full_name: string } | null;
};

export type CriticalRiskAlert = Pick<Risk, "id" | "title" | "severity" | "status" | "due_date"> & {
  clients: { name: string } | null;
};

export const RISK_SEVERITIES: RiskSeverity[] = ["low", "medium", "high", "critical"];

export const RISK_STATUSES: RiskStatus[] = ["open", "in_progress", "resolved", "archived"];

export const RISK_SEVERITY_LABELS: Record<RiskSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  archived: "Archived",
};

/** Statuses staff may set when creating or updating assigned risks. */
export const STAFF_RISK_STATUSES: RiskStatus[] = ["open", "in_progress"];

export const OPEN_RISK_STATUSES: RiskStatus[] = ["open", "in_progress"];

export const RISK_SELECT_COLUMNS =
  "id, organization_id, client_id, title, description, severity, status, owner_user_id, due_date, resolution_notes, resolved_at, created_at, updated_at";

export const RISK_LIST_SELECT = `
  ${RISK_SELECT_COLUMNS},
  clients ( name ),
  users ( full_name )
`;

export function formatRiskDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
