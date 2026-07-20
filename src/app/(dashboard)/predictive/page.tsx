import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { PredictiveOverview } from "@/components/predictive/predictive-overview";
import { PredictiveTimeline } from "@/components/predictive/predictive-timeline";
import { PredictiveWorkspaceLazy } from "@/components/performance/lazy-workspaces";
import { AIUpgradeCard } from "@/components/ai/ai-usage-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { getPredictiveIntelligence } from "@/lib/predictive/cache";
import { listRecentPredictiveSnapshots } from "@/lib/predictive/record";
import { getPredictiveMetrics, getPredictiveSummary } from "@/lib/predictive/summary";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { canViewRevenue } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

export const metadata: Metadata = {
  title: "Predictive Intelligence",
};

export default async function PredictivePage() {
  await requireModuleAccess("dashboard");
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "ai_predictive_intelligence");

  if (!access.allowed) {
    return (
      <>
        <PageHeader
          title="Predictive Intelligence"
          description="Forecasts and early warnings from verified workspace data."
        />
        <PageSurface>
          <AIUpgradeCard
            message={getFeatureUpgradeMessage("ai_predictive_intelligence")}
            requiredPlanLabel={getRequiredPlanLabel("ai_predictive_intelligence")}
            title="Predictive Intelligence"
          />
        </PageSurface>
      </>
    );
  }

  const [summary, intelligence, snapshots] = await Promise.all([
    getPredictiveSummary(session),
    getPredictiveIntelligence(session),
    listRecentPredictiveSnapshots(session.organization.id, 12),
  ]);
  const metrics = getPredictiveMetrics(intelligence);
  metrics.forecastAccuracy = summary.metrics.forecastAccuracy;

  return (
    <>
      <PageHeader
        title="Predictive Intelligence"
        description="Observe → react → predict. Deterministic forecasting from verified signals — no autonomous AI."
      />

      <PageSurface>
        <div className="mb-6 flex items-center gap-2 text-sm text-muted">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>
            Predictions work without external AI. Optional AI assistants may enhance commentary only.
          </span>
        </div>

        <PredictiveOverview summary={summary} intelligence={intelligence} metrics={metrics} />

        <div className="mt-8">
          <PredictiveTimeline snapshots={snapshots} />
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Detailed forecasts</h2>
            <Link href="/clients" className={cn(linkText, "text-xs")}>
              View clients
            </Link>
          </div>
          <PredictiveWorkspaceLazy
            initialData={intelligence}
            showRevenue={canViewRevenue(session.role)}
          />
        </div>
      </PageSurface>
    </>
  );
}
