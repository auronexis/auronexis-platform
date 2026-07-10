import "server-only";

import { buildOperationalSnapshot } from "@/lib/ai/insights/queries";
import {
  buildCustomerSuccessCategories,
  buildExecutiveBrief,
  buildExecutiveInsights,
  buildPriorityClientSummaries,
} from "@/lib/intelligence/recommendations";
import { isReportOverdue } from "@/lib/intelligence/scoring";
import type { SessionContext } from "@/lib/tenancy/context";

export type WorkspaceCopilotContext = {
  organizationName: string;
  periodLabel: string;
  clientCount: number;
  executiveBrief: ReturnType<typeof buildExecutiveBrief>;
  topPriorities: ReturnType<typeof buildPriorityClientSummaries>;
  insights: ReturnType<typeof buildExecutiveInsights>;
  successCategories: ReturnType<typeof buildCustomerSuccessCategories>;
  overdueReports: Array<{ clientId: string; clientName: string; daysSinceLastReport: number | null }>;
  openRisksCount: number;
  openIncidentsCount: number;
  criticalAlerts: Array<{ type: string; title: string; entityId: string; href: string }>;
  features: {
    risks: boolean;
    incidents: boolean;
    sla: boolean;
    profitability: boolean;
  };
};

function compactJson(value: unknown): string {
  return JSON.stringify(value, null, 0);
}

/** Tenant-scoped workspace context — aggregates only, no full dumps. */
export async function loadWorkspaceCopilotContext(
  session: SessionContext,
): Promise<WorkspaceCopilotContext> {
  const snapshot = await buildOperationalSnapshot(session);
  const executiveBrief = buildExecutiveBrief(snapshot, session.user.full_name);

  const overdueReports = snapshot.clients
    .filter((client) => isReportOverdue(client))
    .slice(0, 15)
    .map((client) => ({
      clientId: client.clientId,
      clientName: client.clientName,
      daysSinceLastReport: client.daysSinceLastPublishedReport,
    }));

  const openRisksCount = snapshot.clients.reduce((sum, client) => sum + client.openRisks, 0);
  const openIncidentsCount = snapshot.clients.reduce((sum, client) => sum + client.openIncidents, 0);

  return {
    organizationName: session.organization.name,
    periodLabel: snapshot.period.label,
    clientCount: snapshot.clients.length,
    executiveBrief,
    topPriorities: buildPriorityClientSummaries(snapshot).slice(0, 10),
    insights: buildExecutiveInsights(snapshot).slice(0, 8),
    successCategories: buildCustomerSuccessCategories(snapshot),
    overdueReports,
    openRisksCount,
    openIncidentsCount,
    criticalAlerts: snapshot.dashboard.criticalAlerts.slice(0, 10).map((alert) => ({
      type: alert.type,
      title: alert.title,
      entityId: alert.id,
      href: alert.href,
    })),
    features: {
      risks: snapshot.dashboard.features.risks,
      incidents: snapshot.dashboard.features.incidents,
      sla: snapshot.dashboard.features.sla,
      profitability: snapshot.dashboard.canViewFinancial,
    },
  };
}

export function serializeWorkspaceContext(context: WorkspaceCopilotContext): string {
  return compactJson(context);
}
