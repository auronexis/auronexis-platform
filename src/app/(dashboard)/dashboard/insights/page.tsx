import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { InsightsWorkspace } from "@/components/insights/insights-workspace";
import { AIUpgradeCard } from "@/components/ai/ai-usage-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { getOperationalIntelligence } from "@/lib/ai/insights/get-intelligence";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";
import { listClients } from "@/lib/clients/queries";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getCurrentPlan,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "AI Insights",
};

export default async function DashboardInsightsPage() {
  await requireModuleAccess("dashboard");
  const session = await requireSession();

  const [aiAccess, planKey, clients] = await Promise.all([
    checkPlanFeatureForSession(session, "ai_report_assistant"),
    getCurrentPlan(session.organization.id),
    listClients(session),
  ]);

  const aiEnabled = aiAccess.allowed;
  const usageSummary = await getAIUsageSummaryForSession(session, planKey);

  return (
    <>
      <PageHeader
        title="AI Insights"
        description="Operational intelligence powered by verified workspace data."
      />

      <PageSurface>
        {!aiEnabled ? (
          <AIUpgradeCard
            message={getFeatureUpgradeMessage("ai_report_assistant")}
            requiredPlanLabel={getRequiredPlanLabel("ai_report_assistant")}
            title="Operational Intelligence"
          />
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2 text-sm text-muted">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Insights are generated from clients, risks, incidents, SLA, reports, and profitability.</span>
            </div>
            <InsightsWorkspace
              initialData={await getOperationalIntelligence(session)}
              usageSummary={usageSummary}
              clients={clients.map((client) => ({ id: client.id, name: client.name }))}
            />
          </>
        )}
      </PageSurface>
    </>
  );
}
