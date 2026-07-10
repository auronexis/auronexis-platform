import "server-only";

import { buildClientSuccessSnapshot } from "@/lib/ai/client-success/queries";
import { getClientById } from "@/lib/clients/queries";
import { getClientHealthDetail } from "@/lib/health/record";
import { getClientSLA } from "@/lib/sla/summary";
import type { SessionContext } from "@/lib/tenancy/context";

export type ClientCopilotContext = {
  clientId: string;
  clientName: string;
  clientStatus: string;
  healthScore: number | null;
  healthStatus: string | null;
  healthDelta: number | null;
  healthReason: string | null;
  openRisks: Array<{ id: string; title: string; severity: string; status: string }>;
  openIncidents: Array<{ id: string; title: string; severity: string; status: string }>;
  reportSummary: {
    draftCount: number;
    publishedCount: number;
    daysSinceLastPublished: number | null;
    latestReportTitle: string | null;
    latestReportId: string | null;
  };
  slaSummary: {
    enabled: boolean;
    policyName: string | null;
    breachesThisPeriod: number;
    openBreaches: number;
  };
  profitability: {
    enabled: boolean;
    monthlyRevenue: number | null;
    marginPercent: number | null;
    healthLabel: string | null;
  };
  periodLabel: string;
  recentActivityCount: number;
};

/** Load client-scoped context — rejects cross-tenant access at query layer. */
export async function loadClientCopilotContext(
  session: SessionContext,
  clientId: string,
): Promise<ClientCopilotContext | null> {
  const client = await getClientById(session, clientId);
  if (!client) return null;

  const [snapshot, sla, healthDetail] = await Promise.all([
    buildClientSuccessSnapshot(session, clientId),
    getClientSLA(session, clientId).catch(() => null),
    getClientHealthDetail(session, client).catch(() => ({ latest: null, history: [] })),
  ]);

  if (!snapshot) return null;

  const overview = snapshot.overview;
  const health = healthDetail.latest;
  const profitability = overview.kpis.profitability;

  return {
    clientId: client.id,
    clientName: client.name,
    clientStatus: client.status,
    healthScore: health?.score ?? client.health_score,
    healthStatus: health?.status ?? null,
    healthDelta: health?.delta ?? null,
    healthReason: health?.reason ?? null,
    openRisks: overview.openRisks.slice(0, 8).map((risk) => ({
      id: risk.id,
      title: risk.title,
      severity: risk.severity,
      status: risk.status,
    })),
    openIncidents: overview.openIncidents.slice(0, 8).map((incident) => ({
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
    })),
    reportSummary: {
      draftCount: snapshot.draftReportsCount,
      publishedCount: snapshot.publishedReportsCount,
      daysSinceLastPublished: snapshot.daysSinceLastPublishedReport,
      latestReportTitle: snapshot.latestPublishedReport?.title ?? null,
      latestReportId: snapshot.latestPublishedReport?.id ?? null,
    },
    slaSummary: {
      enabled: snapshot.slaEnabled,
      policyName: sla?.policyName ?? null,
      breachesThisPeriod: snapshot.slaBreachesThisPeriod,
      openBreaches: sla?.breachCount ?? 0,
    },
    profitability: {
      enabled: snapshot.profitabilityEnabled,
      monthlyRevenue: profitability?.monthlyRevenue ?? null,
      marginPercent: profitability?.margin ?? null,
      healthLabel: profitability?.health ?? null,
    },
    periodLabel: snapshot.periodLabel,
    recentActivityCount: overview.recentActivity.length,
  };
}

export function serializeClientContext(context: ClientCopilotContext): string {
  return JSON.stringify(context);
}
