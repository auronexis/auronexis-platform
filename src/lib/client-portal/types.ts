import type { Client, ClientPortalUser, Organization } from "@/types/database";

export type ClientPortalSessionContext = {
  authUserId: string;
  email: string;
  portalUser: ClientPortalUser;
  client: Pick<Client, "id" | "name" | "status" | "organization_id">;
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
};

export type PortalReportListItem = Pick<
  PortalReportView,
  "id" | "title" | "reporting_period_start" | "reporting_period_end" | "sent_at"
>;

export type PortalDashboardData = {
  clientName: string;
  clientStatus: Client["status"];
  openRisksCount: number;
  openIncidentsCount: number;
  latestReport: PortalReportListItem | null;
};

export const PORTAL_CLIENT_SELECT = "id, organization_id, name, status";

export const PORTAL_REPORT_SELECT =
  "id, title, reporting_period_start, reporting_period_end, status, executive_summary, key_wins, key_risks, next_actions, sent_at";

export const PORTAL_REPORT_LIST_SELECT =
  "id, title, reporting_period_start, reporting_period_end, sent_at";

export const PORTAL_RISK_SELECT = "id, title, severity, status, due_date, created_at";

export const PORTAL_INCIDENT_SELECT = "id, title, severity, status, created_at";

export const PORTAL_USER_SELECT =
  "id, auth_user_id, organization_id, client_id, email, full_name, is_active, created_at";
