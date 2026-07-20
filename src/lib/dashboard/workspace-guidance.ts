import type { DashboardData } from "@/lib/dashboard/types";
import type { KnowledgeHubData } from "@/lib/ai/knowledge/types";
import type { OrganizationPlanContext } from "@/lib/plans/types";
import type { ActivationStepStatus } from "@/lib/activation/types";
import { buildActivationSteps } from "@/lib/activation/steps";
import { buildNextBestAction } from "@/lib/activation/recommendations";
import { getCompletionPercent, resolveActivationStage } from "@/lib/activation/scoring";
import { getActivationDataSnapshot } from "@/lib/activation/queries";
import type { SessionContext } from "@/lib/tenancy/context";

export type DashboardOperationalMetricDef = {
  key: "clients" | "risks" | "incidents" | "sla";
  label: string;
  value: number;
  trend: string;
  tone: "info" | "warning" | "danger";
};

/** Feature-gated operational metric definitions for the command center. */
export function resolveDashboardOperationalMetrics(
  data: DashboardData,
): DashboardOperationalMetricDef[] {
  const metrics: DashboardOperationalMetricDef[] = [
    {
      key: "clients",
      label: "Clients",
      value: data.clientHealth.totalClients,
      trend: "+2 this month",
      tone: "info",
    },
  ];

  if (data.features.risks) {
    metrics.push({
      key: "risks",
      label: "Open risks",
      value: data.openRiskCount,
      trend: "Needs attention",
      tone: "warning",
    });
  }

  if (data.features.incidents) {
    metrics.push({
      key: "incidents",
      label: "Open incidents",
      value: data.openIncidentCount,
      trend: "Active queue",
      tone: "danger",
    });
  }

  if (data.features.sla) {
    metrics.push({
      key: "sla",
      label: "Breached SLAs",
      value: data.slaMetrics.breachedCount,
      trend: "Compliance watch",
      tone: "danger",
    });
  }

  return metrics;
}

export type WorkspaceProgressItem = {
  id: string;
  label: string;
  complete: boolean;
  href: string;
};

export type SmartRecommendation = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export type WorkspaceGuidanceInput = {
  data: DashboardData;
  teamMemberCount: number;
  pendingInvitationCount: number;
  knowledgeHub: KnowledgeHubData | null;
  planContext: OrganizationPlanContext | null;
  session?: SessionContext;
};

async function resolveActivationSteps(
  input: WorkspaceGuidanceInput,
): Promise<ActivationStepStatus[]> {
  if (!input.session) {
    return [];
  }

  const snapshot = await getActivationDataSnapshot({
    session: input.session,
    planContext: input.planContext,
    teamMemberCount: input.teamMemberCount,
    pendingInvitationCount: input.pendingInvitationCount,
    knowledgeHub: input.knowledgeHub,
    openRiskCount: input.data.openRiskCount,
    monitoringConnectorCount: input.data.monitoringMetrics.activeConnectors,
  });

  return buildActivationSteps(snapshot, input.session, input.planContext?.features ?? null);
}

function toWorkspaceProgressItems(steps: ActivationStepStatus[]): WorkspaceProgressItem[] {
  return steps
    .filter((step) => !step.locked)
    .map((step) => ({
      id: step.id,
      label: step.label,
      complete: step.complete,
      href: step.href,
    }));
}

/** Setup checklist derived from activation model — backward compatible export. */
export async function buildWorkspaceProgress(
  input: WorkspaceGuidanceInput,
): Promise<WorkspaceProgressItem[]> {
  const steps = await resolveActivationSteps(input);
  return toWorkspaceProgressItems(steps);
}

/** Synchronous fallback for callers without session — legacy dashboard path. */
export function buildWorkspaceProgressSync(input: WorkspaceGuidanceInput): WorkspaceProgressItem[] {
  const { data, teamMemberCount, pendingInvitationCount, knowledgeHub, planContext } = input;
  const clientsExist = data.clientHealth.totalClients > 0;
  const hasReports =
    data.draftReportsCount > 0 ||
    data.reportsMetrics.draftCount > 0 ||
    data.reportsMetrics.publishedThisMonth > 0;
  const knowledgeCount =
    (knowledgeHub?.articles.length ?? 0) +
    (knowledgeHub?.playbooks.length ?? 0) +
    (knowledgeHub?.publishedReports.length ?? 0);
  const billingConfigured =
    planContext?.isActiveSubscription || (planContext?.planKey ?? "starter") !== "starter";

  return [
    { id: "client", label: "Client created", complete: clientsExist, href: "/clients/new" },
    { id: "report", label: "Report created", complete: hasReports, href: "/reports/new" },
    {
      id: "team",
      label: "Team invited",
      complete: teamMemberCount > 1 || pendingInvitationCount > 0,
      href: "/settings/team",
    },
    {
      id: "knowledge",
      label: "Knowledge added",
      complete: knowledgeCount > 0,
      href: "/knowledge",
    },
    {
      id: "risks",
      label: "Risks reviewed",
      complete: !data.features.risks || (clientsExist && data.openRiskCount === 0),
      href: "/risks?tab=open",
    },
    {
      id: "billing",
      label: "Billing configured",
      complete: billingConfigured,
      href: "/settings/billing",
    },
  ];
}

/** Contextual next-step cards — delegates to activation next-best-action when session present. */
export async function buildSmartRecommendations(
  input: WorkspaceGuidanceInput,
): Promise<SmartRecommendation[]> {
  if (!input.session) {
    return buildSmartRecommendationsSync(input);
  }

  const snapshot = await getActivationDataSnapshot({
    session: input.session,
    planContext: input.planContext,
    teamMemberCount: input.teamMemberCount,
    pendingInvitationCount: input.pendingInvitationCount,
    knowledgeHub: input.knowledgeHub,
    openRiskCount: input.data.openRiskCount,
    monitoringConnectorCount: input.data.monitoringMetrics.activeConnectors,
  });

  const steps = buildActivationSteps(snapshot, input.session, input.planContext?.features ?? null);
  const stage = resolveActivationStage(snapshot, steps);
  const next = buildNextBestAction({
    session: input.session,
    snapshot,
    steps,
    stage,
    planContext: input.planContext,
  });

  if (!next) {
    return [];
  }

  return [
    {
      id: next.id,
      title: next.title,
      description: next.description,
      href: next.href,
      cta: "Continue",
    },
  ];
}

/** Legacy synchronous recommendations for compatibility. */
export function buildSmartRecommendationsSync(input: WorkspaceGuidanceInput): SmartRecommendation[] {
  const { data, knowledgeHub, planContext } = input;
  const recommendations: SmartRecommendation[] = [];

  const hasBillingIssue =
    planContext?.subscriptionStatus &&
    ["past_due", "unpaid", "incomplete"].includes(planContext.subscriptionStatus);

  if (hasBillingIssue) {
    recommendations.push({
      id: "billing-issue",
      title: "Resolve billing",
      description: "Your subscription needs attention. Review billing to avoid service interruption.",
      href: "/settings/billing",
      cta: "Open billing",
    });
  }

  if (data.clientHealth.totalClients === 0) {
    recommendations.push({
      id: "first-client",
      title: "Create your first client",
      description: "Add a client to start monitoring health, reports, risks, and incidents.",
      href: "/clients/new",
      cta: "Add client",
    });
  }

  if (knowledgeHub) {
    const knowledgeCount =
      knowledgeHub.articles.length +
      knowledgeHub.playbooks.length +
      knowledgeHub.publishedReports.length;
    if (knowledgeCount === 0) {
      recommendations.push({
        id: "knowledge-start",
        title: "Build organizational knowledge",
        description: "Capture playbooks and learnings from resolved incidents and published reports.",
        href: "/knowledge",
        cta: "Open knowledge hub",
      });
    }
  }

  return recommendations.slice(0, 4);
}

export function getWorkspaceProgressPercent(items: WorkspaceProgressItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  const complete = items.filter((item) => item.complete).length;
  return Math.round((complete / items.length) * 100);
}

/** Activation-aware progress percent from steps. */
export function getActivationProgressPercent(steps: ActivationStepStatus[]): number {
  return getCompletionPercent(steps.filter((step) => !step.locked));
}
