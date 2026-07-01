import type {
  ClientRisk,
  ClientRiskSeverity,
  ClientRiskSource,
  ClientRiskStatus,
  RiskStatus as LegacyRiskStatus,
} from "@/types/database";

export type { ClientRiskSource, ClientRiskSeverity, ClientRiskStatus } from "@/types/database";

export type RiskSeverity = ClientRiskSeverity;
export type RiskStatus = ClientRiskStatus;
export type RiskSource = ClientRiskSource;

export type ClientRiskView = ClientRisk & {
  clients?: { name: string } | null;
  users?: { full_name: string } | null;
};

/** @deprecated Use ClientRiskView — kept for dashboard alert compatibility */
export type RiskWithRelations = ClientRiskView;

export type CriticalRiskAlert = Pick<
  ClientRisk,
  "id" | "title" | "severity" | "status" | "due_at"
> & {
  clients: { name: string } | null;
};

export type RiskSummary = {
  openCount: number;
  criticalCount: number;
  highCount: number;
  dueSoonCount: number;
  acknowledgedCount: number;
  mitigatedCount: number;
  resolvedCount: number;
  dismissedCount: number;
};

export type RiskDetectionResult = {
  created: number;
  updated: number;
  resolved: number;
  errors: string[];
};

export type SafeResult<T> = {
  data: T | null;
  error: string | null;
};

export const RISK_SEVERITIES: RiskSeverity[] = ["low", "medium", "high", "critical"];

export const RISK_STATUSES: RiskStatus[] = [
  "open",
  "acknowledged",
  "mitigated",
  "resolved",
  "dismissed",
];

export const OPEN_RISK_STATUSES: RiskStatus[] = ["open", "acknowledged", "mitigated"];

/** Open statuses on the legacy `risks` table (pre–Risks Engine V1). */
export const LEGACY_OPEN_RISK_STATUSES: LegacyRiskStatus[] = ["open", "in_progress"];

export const CLOSED_RISK_STATUSES: RiskStatus[] = ["resolved", "dismissed"];

const LEGACY_STATUS_DISPLAY_MAP: Record<LegacyRiskStatus, RiskStatus> = {
  open: "open",
  in_progress: "acknowledged",
  resolved: "resolved",
  archived: "dismissed",
};

export const RISK_SOURCES: RiskSource[] = [
  "manual",
  "health_engine",
  "sla",
  "report",
  "activity",
  "portal",
];

export const RISK_SEVERITY_LABELS: Record<RiskSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  mitigated: "Mitigated",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

/** Map legacy or V1 risk status strings for UI badges. */
export function normalizeRiskStatusForDisplay(status: string): RiskStatus {
  if (status in RISK_STATUS_LABELS) {
    return status as RiskStatus;
  }

  if (status in LEGACY_STATUS_DISPLAY_MAP) {
    return LEGACY_STATUS_DISPLAY_MAP[status as LegacyRiskStatus];
  }

  return "open";
}

export const RISK_SOURCE_LABELS: Record<RiskSource, string> = {
  manual: "Manual",
  health_engine: "Health engine",
  sla: "SLA",
  report: "Report",
  activity: "Activity",
  portal: "Portal",
};

export const CLIENT_RISK_SELECT =
  "id, organization_id, client_id, title, description, severity, status, source, category, impact, recommendation, owner_user_id, due_at, detected_at, resolved_at, metadata, created_at, updated_at";

export const CLIENT_RISK_LIST_SELECT = `
  ${CLIENT_RISK_SELECT},
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

export function formatRiskDateTime(value: string | null | undefined): string {
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
