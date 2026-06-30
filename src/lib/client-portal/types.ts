import type { Client, ClientPortalUser, Organization } from "@/types/database";
import type { ClientSlaAssignment } from "@/lib/sla/types";
import type { HealthSnapshot } from "@/lib/health/types";

export type ClientPortalSessionContext = {
  authUserId: string;
  email: string;
  portalUser: ClientPortalUser;
  client: Pick<
    Client,
    | "id"
    | "name"
    | "status"
    | "organization_id"
    | "contact_name"
    | "contact_email"
    | "owner_id"
    | "sla_policy_id"
    | "health_score"
  >;
  organization: Pick<Organization, "id" | "name">;
};

export type PortalRiskView = {
  id: string;
  title: string;
  severity: string;
  status: string;
  due_date: string | null;
  created_at: string;
};

export type PortalIncidentView = {
  id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
};

export type PortalReportView = {
  id: string;
  title: string;
  reporting_period_start: string;
  reporting_period_end: string;
  status: string;
  executive_summary: string | null;
  key_wins: string | null;
  key_risks: string | null;
  next_actions: string | null;
  sent_at: string | null;
  updated_at: string;
};

export type PortalReportListItem = Pick<
  PortalReportView,
  "id" | "title" | "reporting_period_start" | "reporting_period_end" | "sent_at" | "status" | "updated_at"
>;

export type PortalTimelineEvent = {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type PortalContactsData = {
  contactName: string | null;
  contactEmail: string | null;
  accountOwnerName: string | null;
  supportEmail: string | null;
};

export type PortalOverviewData = {
  clientName: string;
  health: Pick<HealthSnapshot, "score" | "status" | "delta" | "reason" | "calculated_at"> | null;
  latestReport: PortalReportListItem | null;
  slaAssignment: ClientSlaAssignment;
  recentEvents: PortalTimelineEvent[];
  contacts: PortalContactsData;
};

export type PortalDashboardData = {
  clientName: string;
  clientStatus: Client["status"];
  openRisksCount: number;
  openIncidentsCount: number;
  latestReport: PortalReportListItem | null;
};

export const PORTAL_CLIENT_SELECT =
  "id, organization_id, name, status, contact_name, contact_email, owner_id, sla_policy_id, health_score";

export const PORTAL_REPORT_SELECT =
  "id, title, reporting_period_start, reporting_period_end, status, executive_summary, key_wins, key_risks, next_actions, sent_at, updated_at";

export const PORTAL_REPORT_LIST_SELECT =
  "id, title, reporting_period_start, reporting_period_end, sent_at, status, updated_at";

export const PORTAL_RISK_SELECT = "id, title, severity, status, due_date, created_at";

export const PORTAL_INCIDENT_SELECT = "id, title, severity, status, created_at";

export const PORTAL_USER_SELECT =
  "id, auth_user_id, organization_id, client_id, email, full_name, is_active, last_login_at, created_at";

export const PORTAL_TIMELINE_EVENT_TYPES = [
  "client.updated",
  "health.changed",
  "report.created",
  "report.updated",
  "sla.updated",
] as const;

export type PortalTimelineEventType = (typeof PORTAL_TIMELINE_EVENT_TYPES)[number];

export const HEALTH_SNAPSHOT_PORTAL_SELECT =
  "id, organization_id, client_id, score, status, delta, reason, breakdown, calculated_at";
