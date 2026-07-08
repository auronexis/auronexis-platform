import type { KnowledgeHubData } from "@/lib/ai/knowledge/types";
import type { DashboardData } from "@/lib/dashboard/types";
import type { OrganizationPlanContext } from "@/lib/plans/types";

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
};

function hasBillingIssue(planContext: OrganizationPlanContext | null): boolean {
  if (!planContext?.subscriptionStatus) {
    return false;
  }
  return ["past_due", "unpaid", "incomplete"].includes(planContext.subscriptionStatus);
}

function isBillingConfigured(planContext: OrganizationPlanContext | null): boolean {
  if (!planContext) {
    return false;
  }
  return planContext.isActiveSubscription || planContext.planKey !== "starter";
}

function hasReports(data: DashboardData): boolean {
  return (
    data.draftReportsCount > 0 ||
    data.reportsMetrics.draftCount > 0 ||
    data.reportsMetrics.publishedThisMonth > 0
  );
}

function knowledgeCount(knowledgeHub: KnowledgeHubData | null): number {
  if (!knowledgeHub) {
    return 0;
  }
  return (
    knowledgeHub.articles.length +
    knowledgeHub.playbooks.length +
    knowledgeHub.publishedReports.length
  );
}

/** Setup checklist derived from existing workspace data — never throws. */
export function buildWorkspaceProgress(input: WorkspaceGuidanceInput): WorkspaceProgressItem[] {
  const { data, teamMemberCount, pendingInvitationCount, knowledgeHub, planContext } = input;
  const clientsExist = data.clientHealth.totalClients > 0;
  const risksApplicable = data.features.risks;

  return [
    {
      id: "client",
      label: "Client created",
      complete: clientsExist,
      href: "/clients/new",
    },
    {
      id: "report",
      label: "Report created",
      complete: hasReports(data),
      href: "/reports/new",
    },
    {
      id: "team",
      label: "Team invited",
      complete: teamMemberCount > 1 || pendingInvitationCount > 0,
      href: "/settings/team",
    },
    {
      id: "knowledge",
      label: "Knowledge added",
      complete: knowledgeCount(knowledgeHub) > 0,
      href: "/knowledge",
    },
    {
      id: "risks",
      label: "Risks reviewed",
      complete: !risksApplicable || (clientsExist && data.openRiskCount === 0),
      href: "/risks?tab=open",
    },
    {
      id: "billing",
      label: "Billing configured",
      complete: isBillingConfigured(planContext),
      href: "/settings/billing",
    },
  ];
}

/** Contextual next-step cards for the dashboard — highest priority first. */
export function buildSmartRecommendations(input: WorkspaceGuidanceInput): SmartRecommendation[] {
  const { data, teamMemberCount, pendingInvitationCount, knowledgeHub, planContext } = input;
  const recommendations: SmartRecommendation[] = [];

  if (hasBillingIssue(planContext)) {
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
  } else if (!hasReports(data)) {
    recommendations.push({
      id: "first-report",
      title: "Generate your first report",
      description: "Publish a client report to demonstrate value and track delivery history.",
      href: "/reports/new",
      cta: "Create report",
    });
  }

  if (data.features.risks && data.openRiskCount > 0) {
    recommendations.push({
      id: "review-risks",
      title: "Review open risks",
      description: `${data.openRiskCount} open risk${data.openRiskCount === 1 ? "" : "s"} need attention across your portfolio.`,
      href: "/risks?tab=open",
      cta: "View risks",
    });
  }

  if (teamMemberCount <= 1 && pendingInvitationCount === 0) {
    recommendations.push({
      id: "invite-team",
      title: "Invite your team",
      description: "Collaborate on incidents, reports, and client delivery with workspace members.",
      href: "/settings/team",
      cta: "Invite member",
    });
  }

  if (knowledgeHub && knowledgeCount(knowledgeHub) === 0) {
    recommendations.push({
      id: "knowledge-start",
      title: "Build organizational knowledge",
      description: "Capture playbooks and learnings from resolved incidents and published reports.",
      href: "/knowledge",
      cta: "Open knowledge hub",
    });
  }

  if (!isBillingConfigured(planContext) && !hasBillingIssue(planContext)) {
    recommendations.push({
      id: "configure-billing",
      title: "Configure billing",
      description: "Choose a plan and set up billing to unlock the full Auroranexis workspace.",
      href: "/settings/plans",
      cta: "View plans",
    });
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
