import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { buildActivationSnapshot } from "@/lib/activation/status";
import { buildAdoptionSnapshot } from "@/lib/adoption/snapshot";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { listPendingInvitations, listTeamMembers } from "@/lib/team/queries";
import { getKnowledgeHubData } from "@/lib/ai/knowledge/get-hub";
import { checkPlanFeatureForSession } from "@/lib/plans";
import { getDashboardData } from "@/lib/dashboard/queries";
import { AdoptionHub } from "@/components/adoption/adoption-hub";
import { AdoptionTracker } from "@/components/adoption/adoption-tracker";
import { recordAdoptionPageViewAction } from "@/lib/adoption/actions";

export const metadata: Metadata = {
  title: "Adoption & Retention",
};

export default async function AdoptionPage() {
  const session = await requireSession();

  const [teamMembers, pendingInvitations, planContext, dashboardData, knowledgeAccess] =
    await Promise.all([
      listTeamMembers(session).catch(() => []),
      listPendingInvitations(session).catch(() => []),
      getOrganizationPlanContextForSession(session).catch(() => null),
      getDashboardData(session),
      checkPlanFeatureForSession(session, "ai_knowledge_search"),
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

  void recordAdoptionPageViewAction();

  return (
    <>
      <AdoptionTracker event="adoption_page_viewed" snapshot={adoption} sourceRoute="/adoption" />
      <AdoptionTracker event="adoption_score_viewed" snapshot={adoption} sourceRoute="/adoption" />
      {adoption.riskLevel === "at_risk" || adoption.riskLevel === "critical" ? (
        <AdoptionTracker
          event="retention_risk_detected"
          snapshot={adoption}
          sourceRoute="/adoption"
        />
      ) : null}
      <AdoptionHub adoption={adoption} />
    </>
  );
}
