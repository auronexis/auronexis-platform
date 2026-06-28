import { ACTIVITY_SELECT } from "@/lib/activity/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import { buildClientProfitabilityRows } from "@/lib/profitability/queries";
import type { ClientProfitabilityRow } from "@/lib/profitability/types";
import {
  getClientReportMetrics,
  getRelatedOpenIncidents,
  getRelatedOpenRisks,
} from "@/lib/reports/queries";
import type { RelatedOpenIncident, RelatedOpenRisk, ReportWithRelations } from "@/lib/reports/types";
import { REPORT_LIST_SELECT } from "@/lib/reports/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";

export type ClientOverviewKpis = {
  profitability: ClientProfitabilityRow | null;
  openRisksCount: number;
  openIncidentsCount: number;
};

export type ClientOverviewData = {
  kpis: ClientOverviewKpis;
  latestReport: ReportWithRelations | null;
  openRisks: RelatedOpenRisk[];
  openRisksTotal: number;
  openIncidents: RelatedOpenIncident[];
  openIncidentsTotal: number;
  recentActivity: ActivityEventView[];
};

const OPEN_ITEMS_LIMIT = 5;
const ACTIVITY_LIMIT = 10;

/** Load client-related activity events without duplicating activity query logic. */
async function listClientActivityEvents(
  session: SessionContext,
  clientId: string,
  limit = ACTIVITY_LIMIT,
): Promise<ActivityEventView[]> {
  const supabase = await createClient();
  const organizationId = session.organization.id;

  const [risksResult, incidentsResult, reportsResult] = await Promise.all([
    supabase.from("risks").select("id").eq("organization_id", organizationId).eq("client_id", clientId),
    supabase
      .from("incidents")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId),
    supabase.from("reports").select("id").eq("organization_id", organizationId).eq("client_id", clientId),
  ]);

  if (risksResult.error || incidentsResult.error || reportsResult.error) {
    throw new Error("Unable to load client activity.");
  }

  const riskIds = (risksResult.data ?? []).map((row) => (row as { id: string }).id);
  const incidentIds = (incidentsResult.data ?? []).map((row) => (row as { id: string }).id);
  const reportIds = (reportsResult.data ?? []).map((row) => (row as { id: string }).id);

  const filters = [
    `and(entity_type.eq.client,entity_id.eq.${clientId})`,
    `and(entity_type.eq.financial,entity_id.eq.${clientId})`,
  ];

  if (riskIds.length > 0) {
    filters.push(`and(entity_type.eq.risk,entity_id.in.(${riskIds.join(",")}))`);
  }

  if (incidentIds.length > 0) {
    filters.push(`and(entity_type.eq.incident,entity_id.in.(${incidentIds.join(",")}))`);
  }

  if (reportIds.length > 0) {
    filters.push(`and(entity_type.eq.report,entity_id.in.(${reportIds.join(",")}))`);
  }

  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("organization_id", organizationId)
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ActivityEventView[];
}

/** Latest report for a client, if any. */
async function getLatestReportForClient(
  session: SessionContext,
  clientId: string,
): Promise<ReportWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_LIST_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReportWithRelations | null) ?? null;
}

/** Profitability KPIs for a single client — reuses portfolio calculation. */
async function getClientProfitabilityRow(
  session: SessionContext,
  clientId: string,
): Promise<ClientProfitabilityRow | null> {
  const rows = await buildClientProfitabilityRows(session);
  return rows.find((row) => row.clientId === clientId) ?? null;
}

/** Full Client 360 overview for the client detail page. */
export async function getClientOverview(
  session: SessionContext,
  clientId: string,
): Promise<ClientOverviewData> {
  const [
    profitability,
    metrics,
    allOpenRisks,
    allOpenIncidents,
    latestReport,
    recentActivity,
  ] = await Promise.all([
    getClientProfitabilityRow(session, clientId),
    getClientReportMetrics(session, clientId),
    getRelatedOpenRisks(session, clientId),
    getRelatedOpenIncidents(session, clientId),
    getLatestReportForClient(session, clientId),
    listClientActivityEvents(session, clientId),
  ]);

  return {
    kpis: {
      profitability,
      openRisksCount: metrics.openRisksCount,
      openIncidentsCount: metrics.openIncidentsCount,
    },
    latestReport,
    openRisks: allOpenRisks.slice(0, OPEN_ITEMS_LIMIT),
    openRisksTotal: allOpenRisks.length,
    openIncidents: allOpenIncidents.slice(0, OPEN_ITEMS_LIMIT),
    openIncidentsTotal: allOpenIncidents.length,
    recentActivity,
  };
}
