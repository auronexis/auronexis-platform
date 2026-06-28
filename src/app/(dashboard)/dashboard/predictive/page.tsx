import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { PredictiveWorkspace } from "@/components/predictive/predictive-workspace";
import { ReportAIUpgradeCard } from "@/components/reports/ai/report-ai-usage-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { getPredictiveIntelligence } from "@/lib/predictive/cache";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { canViewRevenue } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";

export const metadata: Metadata = {
  title: "Predictive Intelligence",
};

export default async function PredictiveDashboardPage() {
  await requireModuleAccess("dashboard");
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "ai_predictive_intelligence");

  return (
    <>
      <PageHeader
        title="Predictive Intelligence"
        description="Forecasts, early warnings, and recommendations built from verified workspace data."
      />

      <PageSurface>
        {!access.allowed ? (
          <ReportAIUpgradeCard
            message={getFeatureUpgradeMessage("ai_predictive_intelligence")}
            requiredPlanLabel={getRequiredPlanLabel("ai_predictive_intelligence")}
            title="Predictive Intelligence"
          />
        ) : (
          <>
            <div className="mb-6 flex items-center gap-2 text-sm text-muted">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>
                Predictions are deterministic — no LLM hallucination. Only verified database signals are used.
              </span>
            </div>
            <PredictiveWorkspace
              initialData={await getPredictiveIntelligence(session)}
              showRevenue={canViewRevenue(session.role)}
            />
          </>
        )}
      </PageSurface>
    </>
  );
}
