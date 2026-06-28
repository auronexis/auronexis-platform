import { createClient } from "@/lib/supabase/server";
import type { ClientPortalSessionContext } from "@/lib/client-portal/types";
import type {
  PortalDashboardData,
  PortalIncidentView,
  PortalReportListItem,
  PortalReportView,
  PortalRiskView,
} from "@/lib/client-portal/types";
import {
  PORTAL_INCIDENT_SELECT,
  PORTAL_REPORT_LIST_SELECT,
  PORTAL_REPORT_SELECT,
  PORTAL_RISK_SELECT,
  PORTAL_USER_SELECT,
} from "@/lib/client-portal/types";
import {
  PORTAL_VISIBLE_REPORT_STATUSES,
  type ClientReportMetrics,
  type RelatedOpenIncident,
  type RelatedOpenRisk,
} from "@/lib/reports/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientPortalUser } from "@/types/database";

/** Portal users linked to a client — agency Owner/Admin only (RLS). */
export async function listPortalUsersForClient(
  session: SessionContext,
  clientId: string,
): Promise<ClientPortalUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_portal_users")
    .select(PORTAL_USER_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ClientPortalUser[];
}

/** Dashboard summary for the signed-in portal user. */
export async function getPortalDashboardData(
  session: ClientPortalSessionContext,
): Promise<PortalDashboardData> {
  const supabase = await createClient();
  const clientId = session.client.id;

  const [risksResult, incidentsResult, latestReportResult] = await Promise.all([
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["open", "investigating"]),
    supabase
      .from("reports")
      .select(PORTAL_REPORT_LIST_SELECT)
      .eq("client_id", clientId)
      .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (risksResult.error || incidentsResult.error || latestReportResult.error) {
    throw new Error("Unable to load portal dashboard.");
  }

  return {
    clientName: session.client.name,
    clientStatus: session.client.status,
    openRisksCount: risksResult.count ?? 0,
    openIncidentsCount: incidentsResult.count ?? 0,
    latestReport: (latestReportResult.data as PortalReportListItem | null) ?? null,
  };
}

/** Published and sent reports visible to the portal user. */
export async function listPortalReports(
  session: ClientPortalSessionContext,
): Promise<PortalReportListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(PORTAL_REPORT_LIST_SELECT)
    .eq("client_id", session.client.id)
    .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PortalReportListItem[];
}

/** Single published or sent report for portal viewing. */
export async function getPortalReportById(
  session: ClientPortalSessionContext,
  reportId: string,
): Promise<PortalReportView | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(PORTAL_REPORT_SELECT)
    .eq("id", reportId)
    .eq("client_id", session.client.id)
    .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PortalReportView | null) ?? null;
}

/** Open risks for the portal user's client. */
export async function listPortalRisks(
  session: ClientPortalSessionContext,
): Promise<PortalRiskView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("risks")
    .select(PORTAL_RISK_SELECT)
    .eq("client_id", session.client.id)
    .in("status", ["open", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PortalRiskView[];
}

/** Open incidents for the portal user's client. */
export async function listPortalIncidents(
  session: ClientPortalSessionContext,
): Promise<PortalIncidentView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select(PORTAL_INCIDENT_SELECT)
    .eq("client_id", session.client.id)
    .in("status", ["open", "investigating"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PortalIncidentView[];
}

/** Metrics for portal PDF export. */
export async function getPortalReportMetrics(
  session: ClientPortalSessionContext,
): Promise<ClientReportMetrics> {
  const supabase = await createClient();
  const clientId = session.client.id;

  const [openRisks, criticalRisks, openIncidents, criticalIncidents] = await Promise.all([
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .in("status", ["open", "in_progress"]),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in("status", ["open", "investigating"]),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .in("status", ["open", "investigating"]),
  ]);

  if (openRisks.error || criticalRisks.error || openIncidents.error || criticalIncidents.error) {
    throw new Error("Unable to load report metrics.");
  }

  return {
    openRisksCount: openRisks.count ?? 0,
    criticalRisksCount: criticalRisks.count ?? 0,
    openIncidentsCount: openIncidents.count ?? 0,
    criticalIncidentsCount: criticalIncidents.count ?? 0,
  };
}

/** Related open risks for portal PDF export. */
export async function getPortalRelatedOpenRisks(
  session: ClientPortalSessionContext,
): Promise<RelatedOpenRisk[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("risks")
    .select("id, title, severity, status, due_date")
    .eq("client_id", session.client.id)
    .in("status", ["open", "in_progress"])
    .order("severity", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RelatedOpenRisk[];
}

/** Related open incidents for portal PDF export. */
export async function getPortalRelatedOpenIncidents(
  session: ClientPortalSessionContext,
): Promise<RelatedOpenIncident[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("id, title, severity, status, due_at")
    .eq("client_id", session.client.id)
    .in("status", ["open", "investigating"])
    .order("severity", { ascending: false })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RelatedOpenIncident[];
}

/** Portal customer onboarding status for the signed-in client. */
export async function getPortalCustomerOnboarding(session: ClientPortalSessionContext) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("portal_customer_onboarding")
      .select("*")
      .eq("organization_id", session.organization.id)
      .eq("client_id", session.client.id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
