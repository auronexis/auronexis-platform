import type { Report, ReportStatus } from "@/types/database";

export type ReportWithRelations = Report & {
  clients: { name: string; contact_email: string | null } | null;
  users: { full_name: string } | null;
};

export type ClientReportMetrics = {
  openRisksCount: number;
  criticalRisksCount: number;
  openIncidentsCount: number;
  criticalIncidentsCount: number;
};

export type RelatedOpenRisk = {
  id: string;
  title: string;
  severity: string;
  status: string;
  due_date: string | null;
};

export type RelatedOpenIncident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  due_at: string | null;
};

export const REPORT_STATUSES: ReportStatus[] = [
  "draft",
  "ready",
  "published",
  "sent",
  "archived",
];

export const STAFF_REPORT_STATUSES: ReportStatus[] = ["draft", "ready"];

/** Statuses editable via the report form (lifecycle actions handle the rest). */
export const EDITABLE_REPORT_STATUSES: ReportStatus[] = ["draft", "ready"];

export const PORTAL_VISIBLE_REPORT_STATUSES: ReportStatus[] = ["published", "sent"];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Draft",
  ready: "Ready",
  published: "Published",
  sent: "Sent",
  archived: "Archived",
};

export const REPORT_SELECT_COLUMNS =
  "id, organization_id, client_id, title, reporting_period_start, reporting_period_end, status, executive_summary, key_wins, key_risks, next_actions, assigned_user_id, sent_at, created_at, updated_at";

export const REPORT_LIST_SELECT = `
  ${REPORT_SELECT_COLUMNS},
  clients ( name, contact_email ),
  users ( full_name )
`;

export function formatReportDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatReportPeriod(start: string, end: string): string {
  return `${formatReportDate(start)} – ${formatReportDate(end)}`;
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}
