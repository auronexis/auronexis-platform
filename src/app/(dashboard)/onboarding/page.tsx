import type { Metadata } from "next";
import { ActivationHub } from "@/components/activation/activation-hub";
import { ActivationTracker } from "@/components/activation/activation-tracker";
import { buildActivationSnapshot } from "@/lib/activation/status";
import { recordOnboardingViewAction } from "@/lib/activation/actions";
import { requireSession } from "@/lib/auth/session";
import { getKnowledgeHubData } from "@/lib/ai/knowledge/get-hub";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { checkPlanFeatureForSession } from "@/lib/plans";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import { listPendingInvitations, listTeamMembers } from "@/lib/team/queries";
import { getDashboardData } from "@/lib/dashboard/queries";

export const metadata: Metadata = {
  title: "Workspace setup",
  description: "Activation hub for configuring your Auroranexis workspace.",
};

export default async function OnboardingPage() {
  const session = await requireSession();
  const [planContext, teamMembers, pendingInvitations, dashboardData, knowledgeAccess] =
    await Promise.all([
      getOrganizationPlanContextForSession(session).catch(() => null),
      listTeamMembers(session).catch(() => []),
      listPendingInvitations(session).catch(() => []),
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

  await recordOnboardingViewAction().catch(() => null);

  const canDismiss = canManageOrganizationSettings(session);

  return (
    <>
      <ActivationTracker
        organizationId={session.organization.id}
        event="onboarding_viewed"
        stage={activation.stage}
        completionPercent={activation.completionPercent}
        sourceRoute="/onboarding"
      />
      <ActivationHub activation={activation} canDismiss={canDismiss} />
    </>
  );
}
