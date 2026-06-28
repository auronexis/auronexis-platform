import { createClient } from "@/lib/supabase/server";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import {
  calculateClientHealth,
  calculateMargin,
  calculateProfit,
  summarizeClientHealth,
  summarizeProfitability,
  type ClientHealthCounts,
  type ClientProfitabilityRow,
  type ProfitabilitySummary,
} from "@/lib/profitability/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ClientFinancial } from "@/types/database";

type ActiveClient = {
  id: string;
  name: string;
};

async function loadActiveClients(organizationId: string): Promise<ActiveClient[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ActiveClient[];
}

async function loadFinancials(organizationId: string): Promise<ClientFinancial[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("client_financials")
    .select("id, organization_id, client_id, monthly_revenue, monthly_cost, notes, created_at, updated_at")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ClientFinancial[];
}

async function loadCriticalRiskClientIds(organizationId: string): Promise<Set<string>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("risks")
    .select("client_id")
    .eq("organization_id", organizationId)
    .eq("severity", "critical")
    .in("status", OPEN_RISK_STATUSES);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => (row as { client_id: string }).client_id));
}

async function loadCriticalIncidentClientIds(organizationId: string): Promise<Set<string>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("incidents")
    .select("client_id")
    .eq("organization_id", organizationId)
    .eq("severity", "critical")
    .in("status", OPEN_INCIDENT_STATUSES);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => (row as { client_id: string }).client_id));
}

/** Build profitability rows for all active clients in the organization. */
export async function buildClientProfitabilityRows(
  session: SessionContext,
): Promise<ClientProfitabilityRow[]> {
  const organizationId = session.organization.id;

  const [clients, financials, criticalRiskClientIds, criticalIncidentClientIds] =
    await Promise.all([
      loadActiveClients(organizationId),
      loadFinancials(organizationId),
      loadCriticalRiskClientIds(organizationId),
      loadCriticalIncidentClientIds(organizationId),
    ]);

  const financialByClientId = new Map(financials.map((financial) => [financial.client_id, financial]));

  return clients.map((client) => {
    const financial = financialByClientId.get(client.id);
    const monthlyRevenue = financial?.monthly_revenue ?? 0;
    const monthlyCost = financial?.monthly_cost ?? 0;
    const profit = calculateProfit(monthlyRevenue, monthlyCost);
    const margin = calculateMargin(monthlyRevenue, monthlyCost);
    const hasCriticalRisk = criticalRiskClientIds.has(client.id);
    const hasCriticalIncident = criticalIncidentClientIds.has(client.id);

    return {
      clientId: client.id,
      clientName: client.name,
      monthlyRevenue,
      monthlyCost,
      profit,
      margin,
      health: calculateClientHealth(margin, hasCriticalRisk, hasCriticalIncident),
      hasCriticalRisk,
      hasCriticalIncident,
      notes: financial?.notes ?? null,
      financialId: financial?.id ?? null,
    };
  });
}

/** Portfolio-level KPI summary for the profitability page. */
export async function getProfitabilitySummary(
  session: SessionContext,
): Promise<ProfitabilitySummary> {
  const rows = await buildClientProfitabilityRows(session);
  return summarizeProfitability(rows);
}

/** Full profitability dataset for the profitability page. */
export async function getProfitabilityOverview(session: SessionContext): Promise<{
  summary: ProfitabilitySummary;
  rows: ClientProfitabilityRow[];
  topClients: ClientProfitabilityRow[];
  mostProfitableClients: ClientProfitabilityRow[];
  needsAttention: ClientProfitabilityRow[];
}> {
  const rows = await buildClientProfitabilityRows(session);
  const summary = summarizeProfitability(rows);

  const topClients = [...rows]
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 5);

  const mostProfitableClients = [...rows]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const needsAttention = rows
    .filter((row) => row.health === "watch" || row.health === "critical")
    .sort((a, b) => {
      if (a.health === b.health) {
        return a.clientName.localeCompare(b.clientName);
      }

      return a.health === "critical" ? -1 : 1;
    });

  return {
    summary,
    rows,
    topClients,
    mostProfitableClients,
    needsAttention,
  };
}

/** Client health counts for the dashboard. */
export async function getClientHealthCounts(
  session: SessionContext,
): Promise<ClientHealthCounts> {
  const rows = await buildClientProfitabilityRows(session);
  return summarizeClientHealth(rows);
}
