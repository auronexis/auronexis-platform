import { buildClientSuccessSnapshot as buildAiClientData } from "@/lib/ai/client-success/queries";
import { getClientById, listClientsSafe } from "@/lib/clients/queries";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationPlanContext } from "@/lib/plans/types";
import {
  computeClientHealth,
  resolveClientTrend,
  resolveHealthStatus,
} from "@/lib/customer-success/health";
import { buildClientSignals } from "@/lib/customer-success/signals";
import { resolveSuggestedPlaybooks } from "@/lib/customer-success/playbook-engine";
import {
  countClientIncidents,
  countClientRisks,
  listPlaybookInstancesForOrg,
  listTasksForOrg,
  mapPlaybookInstance,
  mapTask,
} from "@/lib/customer-success/queries";
import { resolveRecoveryStatus } from "@/lib/customer-success/recovery";
import { countOverdueTasks } from "@/lib/customer-success/task-engine";
import {
  buildPlaybookWorkload,
  buildPortfolioMetrics,
  buildPortfolioPriorityQueue,
  summarizePortfolioCounts,
} from "@/lib/customer-success/metrics";
import { PORTFOLIO_PAGE_SIZE } from "@/lib/customer-success/constants";
import type {
  ClientSuccessAction,
  ClientSuccessSnapshot,
  CustomerSuccessPortfolio,
  DashboardCustomerSuccessMode,
} from "@/lib/customer-success/types";
import type { AdoptionSnapshot } from "@/lib/adoption/types";
import type { ActivationSnapshot } from "@/lib/activation/types";

export type BuildClientSnapshotInput = {
  session: SessionContext;
  clientId: string;
  planContext: OrganizationPlanContext | null;
};

function buildNextBestAction(
  clientId: string,
  snapshot: Pick<
    ClientSuccessSnapshot,
    "suggestedPlaybooks" | "riskSignals" | "overdueTaskCount" | "activePlaybooks"
  >,
): ClientSuccessAction | null {
  if (snapshot.overdueTaskCount > 0) {
    return {
      key: "complete_overdue_tasks",
      title: "Complete overdue success tasks",
      description: "Finish overdue playbook tasks to restore client health.",
      route: `/clients/${clientId}/success`,
      ctaLabel: "View tasks",
      reason: `${snapshot.overdueTaskCount} task(s) are overdue.`,
    };
  }
  const top = snapshot.suggestedPlaybooks.find((p) => p.available && p.permitted);
  if (top) {
    return {
      key: `start_${top.key}`,
      title: `Start ${top.name}`,
      description: top.description,
      route: `/clients/${clientId}/success`,
      ctaLabel: "Start playbook",
      reason: top.reason,
    };
  }
  const risk = snapshot.riskSignals[0];
  if (risk) {
    return {
      key: "review_risk",
      title: "Review client risk",
      description: risk.description,
      route: "/risks",
      ctaLabel: "Review",
      reason: risk.description,
    };
  }
  return null;
}

/** Build per-client customer success snapshot. */
export async function buildClientSuccessSnapshot(
  input: BuildClientSnapshotInput,
): Promise<ClientSuccessSnapshot | null> {
  const { session, clientId, planContext } = input;
  const client = await getClientById(session, clientId);
  if (!client) return null;

  const [aiData, riskCounts, openIncidents, allInstances, allTasks] = await Promise.all([
    buildAiClientData(session, clientId),
    countClientRisks(session.organization.id, clientId),
    countClientIncidents(session.organization.id, clientId),
    listPlaybookInstancesForOrg(session.organization.id, clientId),
    listTasksForOrg(session.organization.id, clientId),
  ]);

  if (!aiData) return null;

  const overdueTaskCount = countOverdueTasks(allTasks);
  const healthBreakdown = computeClientHealth({
    data: aiData,
    openRiskCount: riskCounts.open,
    criticalRiskCount: riskCounts.critical,
    openIncidentCount: openIncidents,
    overdueTaskCount,
    clientCreatedAt: client.created_at,
  });

  const isNew =
    Math.floor((Date.now() - new Date(client.created_at).getTime()) / 86400000) <= 14;
  const healthStatus = resolveHealthStatus(
    healthBreakdown,
    aiData,
    riskCounts.critical,
    openIncidents,
    isNew,
  );
  const trend = resolveClientTrend(aiData);
  const { adoptionSignals, riskSignals, valueSignals } = buildClientSignals({
    data: aiData,
    openRiskCount: riskCounts.open,
    criticalRiskCount: riskCounts.critical,
    openIncidentCount: openIncidents,
    overdueTaskCount,
  });

  const activeKeys = allInstances
    .filter((i) => ["active", "paused", "suggested"].includes(i.status))
    .map((i) => i.playbook_key);

  const suggestedPlaybooks = resolveSuggestedPlaybooks({
    session,
    planKey: planContext?.planKey ?? "starter",
    riskSignals,
    adoptionSignals,
    activePlaybookKeys: activeKeys,
  });

  const activePlaybooks = allInstances
    .filter((i) => ["active", "paused"].includes(i.status))
    .map((i) => mapPlaybookInstance(i, allTasks.filter((t) => t.playbook_instance_id === i.id)));

  const tasks = allTasks.map(mapTask);
  const latestActivity = aiData.recentActivity[0];

  const recoveryStatus = resolveRecoveryStatus({
    activeInstances: allInstances,
    healthScoreBefore: allInstances.find((i) => i.recovery_score_before !== null)?.recovery_score_before ?? null,
    healthScoreAfter: healthBreakdown.total,
    hasRecentPositiveSignal: valueSignals.some((s) => s.impact === "positive"),
  });

  const snapshot: ClientSuccessSnapshot = {
    organizationId: session.organization.id,
    clientId,
    clientName: client.name,
    healthScore: healthBreakdown.total,
    healthStatus,
    healthBreakdown,
    trend,
    adoptionSignals,
    riskSignals,
    valueSignals,
    openRiskCount: riskCounts.open,
    criticalRiskCount: riskCounts.critical,
    openIncidentCount: openIncidents,
    overdueTaskCount,
    lastPublishedReportAt: aiData.latestPublishedReport?.updated_at ?? null,
    lastPortalActivityAt: null,
    lastMeaningfulActivityAt: latestActivity?.created_at ?? null,
    daysSinceLastPublishedReport: aiData.daysSinceLastPublishedReport,
    daysSinceLastMeaningfulActivity: aiData.daysSinceLastActivity,
    activePlaybooks,
    suggestedPlaybooks,
    tasks,
    recoveryStatus,
    nextBestAction: null,
    generatedAt: new Date().toISOString(),
  };

  snapshot.nextBestAction = buildNextBestAction(clientId, {
    suggestedPlaybooks: snapshot.suggestedPlaybooks,
    riskSignals: snapshot.riskSignals,
    overdueTaskCount: snapshot.overdueTaskCount,
    activePlaybooks,
  });

  return snapshot;
}

export type BuildPortfolioInput = {
  session: SessionContext;
  planContext: OrganizationPlanContext | null;
};

/** Build organization customer success portfolio. */
export async function buildCustomerSuccessPortfolio(
  input: BuildPortfolioInput,
): Promise<CustomerSuccessPortfolio> {
  const { session, planContext } = input;
  const { clients } = await listClientsSafe(session, { includeArchived: false });
  const limited = clients.slice(0, PORTFOLIO_PAGE_SIZE);

  const [allInstances, allTasks] = await Promise.all([
    listPlaybookInstancesForOrg(session.organization.id),
    listTasksForOrg(session.organization.id),
  ]);

  const snapshots: ClientSuccessSnapshot[] = [];
  for (const client of limited) {
    const snap = await buildClientSuccessSnapshot({
      session,
      clientId: client.id,
      planContext,
    });
    if (snap) snapshots.push(snap);
  }

  const clientNames = new Map(limited.map((c) => [c.id, c.name]));
  const counts = summarizePortfolioCounts(snapshots);

  return {
    organizationId: session.organization.id,
    totalActiveClients: clients.length,
    ...counts,
    metrics: buildPortfolioMetrics(allInstances, allTasks),
    priorityQueue: buildPortfolioPriorityQueue(snapshots),
    activePlaybooks: buildPlaybookWorkload(allInstances, allTasks, clientNames),
    generatedAt: new Date().toISOString(),
  };
}

export function resolveDashboardCustomerSuccessMode(
  activation: ActivationSnapshot,
  adoption: AdoptionSnapshot,
  portfolio: CustomerSuccessPortfolio,
): DashboardCustomerSuccessMode {
  const activationIncomplete =
    !activation.firstValueReached ||
    ["not_started", "getting_started", "building_foundation"].includes(activation.stage);

  if (activationIncomplete) return "hidden";

  const adoptionCritical =
    adoption.riskLevel === "critical" ||
    adoption.riskLevel === "at_risk" ||
    adoption.stage === "at_risk" ||
    adoption.stage === "inactive";

  if (adoptionCritical) return "hidden";

  if (portfolio.criticalCount > 0 || portfolio.overdueTaskCount > 0) {
    return "critical";
  }

  if (portfolio.activePlaybookCount > 0 || portfolio.atRiskCount > 0) {
    return "summary";
  }

  return "hidden";
}

export function summarizeCustomerSuccessForDashboard(portfolio: CustomerSuccessPortfolio) {
  const top = portfolio.priorityQueue[0] ?? null;
  return {
    atRiskCount: portfolio.atRiskCount + portfolio.criticalCount,
    overdueTaskCount: portfolio.overdueTaskCount,
    activePlaybookCount: portfolio.activePlaybookCount,
    topClient: top,
  };
}
