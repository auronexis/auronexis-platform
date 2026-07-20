import { cache } from "react";
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
  REPORT_SELECT_COLUMNS_V1,
  isMissingReportColumnError,
  normalizeReportRow,
} from "@/lib/reports/types";
import type { SessionContext } from "@/lib/tenancy/context";

type ListReportsOptions = {
  includeArchived?: boolean;
};

const REPORT_LIST_SELECT_V1 = `
  ${REPORT_SELECT_COLUMNS_V1},
  clients ( name, contact_email ),
  users ( full_name )
`;

async function selectReportById(
  session: SessionContext,
  reportId: string,
): Promise<{ row: ReportWithRelations | null; error: string | null }> {
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("reports")
    .select(REPORT_LIST_SELECT)
    .eq("id", reportId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error && isMissingReportColumnError(error.message)) {
    ({ data, error } = await supabase
      .from("reports")
      .select(REPORT_LIST_SELECT_V1)
      .eq("id", reportId)
      .eq("organization_id", session.organization.id)
      .maybeSingle());
  }

  if (error) {
    console.warn("[reports] getReportById failed:", error.message);
    return { row: null, error: error.message };
  }

  return {
    row: data ? normalizeReportRow(data as Record<string, unknown>) : null,
    error: null,
  };
}

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

  let { data, error } = await query;

  if (error && isMissingReportColumnError(error.message)) {
    let legacyQuery = supabase
      .from("reports")
      .select(REPORT_LIST_SELECT_V1)
      .eq("organization_id", session.organization.id)
      .order("updated_at", { ascending: false });

    if (!options.includeArchived) {
      legacyQuery = legacyQuery.neq("status", "archived");
    }

    ({ data, error } = await legacyQuery);
  }

  if (error) {
    console.warn("[reports] listReports failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => normalizeReportRow(row as Record<string, unknown>));
}

/** Load a single report by id within the current organization. */
export const getReportById = cache(async function getReportById(
  session: SessionContext,
  reportId: string,
): Promise<ReportWithRelations | null> {
  const { row } = await selectReportById(session, reportId);
  return row;
});

/** Summary risk/incident counts for a linked client. */
export async function getClientReportMetrics(
  session: SessionContext,
  clientId: string,
): Promise<ClientReportMetrics> {
  const supabase = await createClient();
  const organizationId = session.organization.id;

  const [openRisks, criticalRisks, openIncidents, criticalIncidents] = await Promise.all([
    supabase
      .from("client_risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES),
    supabase
      .from("client_risks")
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
    console.warn("[reports] getClientReportMetrics failed");
    return {
      openRisksCount: 0,
      criticalRisksCount: 0,
      openIncidentsCount: 0,
      criticalIncidentsCount: 0,
    };
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
    .from("client_risks")
    .select("id, title, severity, status, due_at")
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .in("status", OPEN_RISK_STATUSES)
    .order("severity", { ascending: false })
    .order("due_at", { ascending: true, nullsFirst: false });

  if (error) {
    console.warn("[reports] getRelatedOpenRisks failed:", error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    due_at: string | null;
  }>).map((row) => ({
    id: row.id,
    title: row.title,
    severity: row.severity,
    status: row.status,
    due_date: row.due_at,
  }));
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
    console.warn("[reports] getRelatedOpenRisks failed:", error.message);
    return [];
  }

  return (data ?? []) as RelatedOpenIncident[];
}
