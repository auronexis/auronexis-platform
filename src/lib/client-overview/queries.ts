import { ACTIVITY_SELECT, ACTIVITY_SELECT_LEGACY } from "@/lib/activity/queries";
import type { ActivityEventView } from "@/lib/activity/types";
import { buildClientProfitabilityRows } from "@/lib/profitability/queries";
import type { ClientProfitabilityRow } from "@/lib/profitability/types";
import {
  getClientReportMetrics,
  getRelatedOpenIncidents,
  getRelatedOpenRisks,
} from "@/lib/reports/queries";
import type { RelatedOpenIncident, RelatedOpenRisk, ReportWithRelations } from "@/lib/reports/types";
import { REPORT_LIST_SELECT, REPORT_SELECT_COLUMNS_V1, isMissingReportColumnError, normalizeReportRow } from "@/lib/reports/types";
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

const EMPTY_CLIENT_OVERVIEW: ClientOverviewData = {
  kpis: {
    profitability: null,
    openRisksCount: 0,
    openIncidentsCount: 0,
  },
  latestReport: null,
  openRisks: [],
  openRisksTotal: 0,
  openIncidents: [],
  openIncidentsTotal: 0,
  recentActivity: [],
};

function normalizeActivityEvent(row: Record<string, unknown>): ActivityEventView {
  const eventType =
    typeof row.event_type === "string" && row.event_type.length > 0
      ? row.event_type
      : typeof row.action === "string"
        ? row.action
        : "unknown";

  return {
    ...(row as ActivityEventView),
    event_type: eventType,
  };
}

/** Load client-related activity events without duplicating activity query logic. */
async function listClientActivityEvents(
  session: SessionContext,
  clientId: string,
  limit = ACTIVITY_LIMIT,
): Promise<ActivityEventView[]> {
  const supabase = await createClient();
  const organizationId = session.organization.id;

  const [risksResult, incidentsResult, reportsResult] = await Promise.all([
    supabase.from("client_risks").select("id").eq("organization_id", organizationId).eq("client_id", clientId),
    supabase
      .from("incidents")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId),
    supabase.from("reports").select("id").eq("organization_id", organizationId).eq("client_id", clientId),
  ]);

  if (risksResult.error || incidentsResult.error || reportsResult.error) {
    console.warn("[client-overview] unable to load entity ids for activity");
    return [];
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

  let { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("organization_id", organizationId)
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error && error.message.toLowerCase().includes("event_type")) {
    ({ data, error } = await supabase
      .from("activity_events")
      .select(ACTIVITY_SELECT_LEGACY)
      .eq("organization_id", organizationId)
      .or(filters.join(","))
      .order("created_at", { ascending: false })
      .limit(limit));
  }

  if (error) {
    console.warn("[client-overview] listClientActivityEvents failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => normalizeActivityEvent(row as Record<string, unknown>));
}

/** Latest report for a client, if any. */
async function getLatestReportForClient(
  session: SessionContext,
  clientId: string,
): Promise<ReportWithRelations | null> {
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("reports")
    .select(REPORT_LIST_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && isMissingReportColumnError(error.message)) {
    ({ data, error } = await supabase
      .from("reports")
      .select(`${REPORT_SELECT_COLUMNS_V1}, clients ( name, contact_email ), users ( full_name )`)
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle());
  }

  if (error) {
    console.warn("[client-overview] getLatestReportForClient failed:", error.message);
    return null;
  }

  return data ? normalizeReportRow(data as Record<string, unknown>) : null;
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
  try {
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
  } catch (error) {
    console.warn("[client-overview] getClientOverview failed:", error);
    return EMPTY_CLIENT_OVERVIEW;
  }
}
