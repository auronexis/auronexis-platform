import { createClient } from "@/lib/supabase/server";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import type {
  ClientReportMetrics,
  RelatedOpenIncident,
  RelatedOpenRisk,
  ReportWithRelations,
} from "@/lib/reports/types";
import {
  REPORT_LIST_SELECT,
} from "@/lib/reports/types";
import type { SessionContext } from "@/lib/tenancy/context";

type ListReportsOptions = {
  includeArchived?: boolean;
};

/** List reports for the current organization with client and assignee names. */
export async function listReports(
  session: SessionContext,
  options: ListReportsOptions = {},
): Promise<ReportWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("reports")
    .select(REPORT_LIST_SELECT)
    .eq("organization_id", session.organization.id)
    .order("updated_at", { ascending: false });

  if (!options.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReportWithRelations[];
}

/** Load a single report by id within the current organization. */
export async function getReportById(
  session: SessionContext,
  reportId: string,
): Promise<ReportWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_LIST_SELECT)
    .eq("id", reportId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReportWithRelations | null) ?? null;
}

/** Summary risk/incident counts for a linked client. */
export async function getClientReportMetrics(
  session: SessionContext,
  clientId: string,
): Promise<ClientReportMetrics> {
  const supabase = await createClient();
  const organizationId = session.organization.id;

  const [openRisks, criticalRisks, openIncidents, criticalIncidents] = await Promise.all([
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES),
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .in("status", OPEN_RISK_STATUSES),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", OPEN_INCIDENT_STATUSES),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .in("status", OPEN_INCIDENT_STATUSES),
  ]);

  if (openRisks.error || criticalRisks.error || openIncidents.error || criticalIncidents.error) {
    throw new Error("Unable to load client report metrics.");
  }

  return {
    openRisksCount: openRisks.count ?? 0,
    criticalRisksCount: criticalRisks.count ?? 0,
    openIncidentsCount: openIncidents.count ?? 0,
    criticalIncidentsCount: criticalIncidents.count ?? 0,
  };
}

/** Open risks linked to the report client. */
export async function getRelatedOpenRisks(
  session: SessionContext,
  clientId: string,
): Promise<RelatedOpenRisk[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("risks")
    .select("id, title, severity, status, due_date")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", OPEN_RISK_STATUSES)
    .order("severity", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RelatedOpenRisk[];
}

/** Open incidents linked to the report client. */
export async function getRelatedOpenIncidents(
  session: SessionContext,
  clientId: string,
): Promise<RelatedOpenIncident[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("id, title, severity, status, due_at")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", OPEN_INCIDENT_STATUSES)
    .order("severity", { ascending: false })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RelatedOpenIncident[];
}
