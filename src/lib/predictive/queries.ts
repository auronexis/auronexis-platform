import "server-only";

import { buildClientProfitabilityRows } from "@/lib/profitability/queries";
import type { ClientProfitabilityRow } from "@/lib/profitability/types";
import { canUseFeature } from "@/lib/plans/guards";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { HistoricalWindowKey, HistoricalWindowMetrics } from "@/lib/predictive/types";
import { buildClientSuccessSnapshot } from "@/lib/ai/client-success/queries";
import type { ClientSuccessSnapshot } from "@/lib/ai/client-success/queries";

export type ClientPredictiveSnapshot = {
  clientId: string;
  clientName: string;
  success: ClientSuccessSnapshot;
  profitability: ClientProfitabilityRow | null;
};

export type OrganizationPredictiveSnapshot = {
  organizationId: string;
  organizationName: string;
  clients: ClientPredictiveSnapshot[];
  historicalWindows: HistoricalWindowMetrics[];
  risksEnabled: boolean;
  incidentsEnabled: boolean;
  slaEnabled: boolean;
  profitabilityEnabled: boolean;
  automationEnabled: boolean;
};

const WINDOW_DAYS: Record<HistoricalWindowKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "12m": 365,
};

const WINDOW_LABELS: Record<HistoricalWindowKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "12m": "Last 12 months",
};

function windowStart(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

async function countInRange(
  session: SessionContext,
  table: "incidents" | "risks" | "reports",
  start: string,
  options?: { status?: string[] },
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .gte("created_at", start);

  if (table === "reports" && options?.status) {
    query = query.in("status", options.status);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function countSlaBreachesSince(session: SessionContext, start: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", session.organization.id)
    .eq("action", "sla_breached")
    .gte("created_at", start);

  if (error) return 0;
  return count ?? 0;
}

async function getAutomationStats(
  session: SessionContext,
  start: string,
): Promise<{ runs: number; successRate: number | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("automation_executions")
    .select("status")
    .eq("organization_id", session.organization.id)
    .gte("created_at", start);

  if (error || !data || data.length === 0) {
    return { runs: 0, successRate: null };
  }

  const rows = data as Array<{ status: string }>;
  const success = rows.filter(
    (row) => row.status === "completed" || row.status === "partial" || row.status === "simulation",
  ).length;

  return {
    runs: rows.length,
    successRate: Math.round((success / rows.length) * 100),
  };
}

async function buildHistoricalWindows(session: SessionContext): Promise<HistoricalWindowMetrics[]> {
  const [risksEnabled, incidentsEnabled, slaEnabled, automationEnabled] = await Promise.all([
    canUseFeature(session.organization.id, "risks"),
    canUseFeature(session.organization.id, "incidents"),
    canUseFeature(session.organization.id, "sla_tracking"),
    canUseFeature(session.organization.id, "automation_engine"),
  ]);

  const windows: HistoricalWindowMetrics[] = [];

  for (const key of Object.keys(WINDOW_DAYS) as HistoricalWindowKey[]) {
    const start = windowStart(WINDOW_DAYS[key]);
    const [incidents, risks, reportsPublished, slaBreaches, automation] = await Promise.all([
      incidentsEnabled ? countInRange(session, "incidents", start) : 0,
      risksEnabled ? countInRange(session, "risks", start) : 0,
      countInRange(session, "reports", start, { status: ["published", "sent"] }),
      slaEnabled ? countSlaBreachesSince(session, start) : 0,
      automationEnabled ? getAutomationStats(session, start) : { runs: 0, successRate: null },
    ]);

    windows.push({
      key,
      label: WINDOW_LABELS[key],
      incidents,
      risks,
      reportsPublished,
      slaBreaches,
      automationSuccessRate: automation.successRate,
      automationRuns: automation.runs,
    });
  }

  return windows;
}

async function countOpenItems(
  session: SessionContext,
  clientId: string,
): Promise<{ openIncidents: number; openRisks: number }> {
  const supabase = await createClient();

  const [incidents, risks] = await Promise.all([
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .in("status", OPEN_INCIDENT_STATUSES),
    supabase
      .from("risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES),
  ]);

  return {
    openIncidents: incidents.count ?? 0,
    openRisks: risks.count ?? 0,
  };
}

/** Build verified organization predictive snapshot — server-side only. */
export async function buildOrganizationPredictiveSnapshot(
  session: SessionContext,
): Promise<OrganizationPredictiveSnapshot> {
  const profitabilityRows = await buildClientProfitabilityRows(session);
  const profitabilityByClient = new Map(profitabilityRows.map((row) => [row.clientId, row]));

  const supabase = await createClient();
  const { data: clientRows } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", session.organization.id)
    .neq("status", "archived")
    .order("name", { ascending: true });

  const activeClients = (clientRows ?? []) as Array<{ id: string; name: string }>;

  const snapshots = await Promise.all(
    activeClients.map(async (client) => {
      const success = await buildClientSuccessSnapshot(session, client.id);
      if (!success) return null;
      return {
        clientId: client.id,
        clientName: client.name,
        success,
        profitability: profitabilityByClient.get(client.id) ?? null,
      } satisfies ClientPredictiveSnapshot;
    }),
  );

  const [
    historicalWindows,
    risksEnabled,
    incidentsEnabled,
    slaEnabled,
    profitabilityEnabled,
    automationEnabled,
  ] = await Promise.all([
    buildHistoricalWindows(session),
    canUseFeature(session.organization.id, "risks"),
    canUseFeature(session.organization.id, "incidents"),
    canUseFeature(session.organization.id, "sla_tracking"),
    canUseFeature(session.organization.id, "profitability"),
    canUseFeature(session.organization.id, "automation_engine"),
  ]);

  return {
    organizationId: session.organization.id,
    organizationName: session.organization.name,
    clients: snapshots.filter((item): item is ClientPredictiveSnapshot => item != null),
    historicalWindows,
    risksEnabled,
    incidentsEnabled,
    slaEnabled,
    profitabilityEnabled,
    automationEnabled,
  };
}

export async function buildClientPredictiveSnapshot(
  session: SessionContext,
  clientId: string,
): Promise<ClientPredictiveSnapshot | null> {
  const success = await buildClientSuccessSnapshot(session, clientId);
  if (!success) return null;

  const profitabilityRows = await buildClientProfitabilityRows(session);
  const profitability = profitabilityRows.find((row) => row.clientId === clientId) ?? null;

  return {
    clientId,
    clientName: success.clientName,
    success,
    profitability,
  };
}

export { countOpenItems };
