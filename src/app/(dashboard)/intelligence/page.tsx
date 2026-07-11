import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { buildActivationSnapshot } from "@/lib/activation/status";
import { buildAdoptionSnapshot } from "@/lib/adoption/snapshot";
import { buildCustomerSuccessPortfolio } from "@/lib/customer-success/snapshot";
import { getDashboardData } from "@/lib/dashboard/queries";
import { buildExecutiveBriefing } from "@/lib/executive-intelligence/briefing";
import { buildExecutiveIntelligenceSnapshot } from "@/lib/executive-intelligence/snapshot";
import { generateGroundedExecutiveNarrative } from "@/lib/executive-intelligence/provider";
import { ExecutiveIntelligenceHub } from "@/components/executive-intelligence/executive-intelligence-hub";
import { ExecutiveIntelligenceTracker } from "@/components/executive-intelligence/executive-intelligence-tracker";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { checkPlanFeatureForSession } from "@/lib/plans";
import { listPendingInvitations, listTeamMembers } from "@/lib/team/queries";
import { getKnowledgeHubData } from "@/lib/ai/knowledge/get-hub";

export const metadata: Metadata = {
  title: "Executive Intelligence",
};

export default async function IntelligencePage() {
  await requireModuleAccess("executive_intelligence");
  const session = await requireSession();

  if (!sessionHasPermission(session, "executive_intelligence.read")) {
    return (
      <PageSurface>
        <p className="text-sm text-muted">You do not have permission to view executive intelligence.</p>
      </PageSurface>
    );
  }

  const [dashboardData, planContext, teamMembers, pendingInvitations, knowledgeAccess, aiAccess] =
    await Promise.all([
      getDashboardData(session),
      getOrganizationPlanContextForSession(session).catch(() => null),
      listTeamMembers(session).catch(() => []),
      listPendingInvitations(session).catch(() => []),
      checkPlanFeatureForSession(session, "ai_knowledge_search"),
      checkPlanFeatureForSession(session, "ai_report_assistant"),
    ]);

  const knowledgeHub = knowledgeAccess.allowed
    ? await getKnowledgeHubData(session).catch(() => null)
    : null;

  const activation = await buildActivationSnapshot({
    session,
    planContext,
    teamMemberCount: teamMembers.length || 1,
    pendingInvitationCount: pendingInvitations.length,
    knowledgeHub,
    openRiskCount: dashboardData.openRiskCount,
    monitoringConnectorCount: dashboardData.monitoringMetrics.activeConnectors,
  });

  const adoption = await buildAdoptionSnapshot({
    session,
    planContext,
    teamMemberCount: teamMembers.length || 1,
    pendingInvitationCount: pendingInvitations.length,
    knowledgeHub,
    openRiskCount: dashboardData.openRiskCount,
    monitoringConnectorCount: dashboardData.monitoringMetrics.activeConnectors,
    activation,
  });

  const canReadCustomerSuccess = sessionHasPermission(session, "customer_success.read");
  const customerSuccessPortfolio = canReadCustomerSuccess
    ? await buildCustomerSuccessPortfolio({ session, planContext })
    : null;

  const snapshot = await buildExecutiveIntelligenceSnapshot({
    session,
    dashboardData,
    activation,
    adoption,
    customerSuccessPortfolio,
    planContext,
    canReadCustomerSuccess,
  });

  let briefing = buildExecutiveBriefing(snapshot);

  if (sessionHasPermission(session, "executive_intelligence.generate") && aiAccess.allowed) {
    const narrative = await generateGroundedExecutiveNarrative({
      session,
      snapshot,
      briefing,
      planKey: planContext?.planKey ?? "starter",
      aiAllowed: true,
    });
    if (narrative.generatedBy === "ai_assisted") {
      briefing = { ...briefing, narrative: narrative.narrative, generatedBy: "ai_assisted" };
    }
  }

  return (
    <>
      <PageHeader
        title="Executive Intelligence"
        description="Evidence-backed operational briefings and priority findings."
      />
      <ExecutiveIntelligenceTracker
        event="executive_intelligence_viewed"
        organizationId={session.organization.id}
      />
      <PageSurface>
        <ExecutiveIntelligenceHub snapshot={snapshot} briefing={briefing} aiEnabled={aiAccess.allowed} />
      </PageSurface>
    </>
  );
}
