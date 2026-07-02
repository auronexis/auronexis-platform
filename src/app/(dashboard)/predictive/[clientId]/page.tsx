import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PredictiveCard } from "@/components/predictive/predictive-card";
import { PredictiveChurnCard } from "@/components/predictive/predictive-churn-card";
import { PredictiveClientPanel } from "@/components/predictive/predictive-client-panel";
import { PredictiveConfidenceBadge } from "@/components/predictive/predictive-confidence-badge";
import { PredictiveEmptyState } from "@/components/predictive/predictive-empty-state";
import { PredictiveHealthForecast } from "@/components/predictive/predictive-health-forecast";
import { PredictiveIncidentForecast } from "@/components/predictive/predictive-incident-forecast";
import { PredictiveRiskForecast } from "@/components/predictive/predictive-risk-forecast";
import { PredictiveTimeline } from "@/components/predictive/predictive-timeline";
import { PredictiveTrendBadge } from "@/components/predictive/predictive-trend-badge";
import { ReportAIUpgradeCard } from "@/components/reports/ai/report-ai-usage-card";
import { PageHeader } from "@/components/layout/page-header";
import { PageSurface } from "@/components/ui/page-surface";
import { requireSession } from "@/lib/auth/session";
import { getClientPredictiveAnalysis } from "@/lib/predictive/cache";
import { listRecentPredictiveSnapshots } from "@/lib/predictive/record";
import { getClientPredictiveSummary } from "@/lib/predictive/summary";
import { INSUFFICIENT_PREDICTIVE_DATA } from "@/lib/predictive/types";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { canViewRevenue } from "@/lib/rbac/permissions";
import { requireModuleAccess } from "@/lib/rbac/route-guards";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type PredictiveClientPageProps = {
  params: Promise<{ clientId: string }>;
};

export async function generateMetadata({ params }: PredictiveClientPageProps): Promise<Metadata> {
  const { clientId } = await params;
  return { title: `Predictive — ${clientId.slice(0, 8)}` };
}

export default async function PredictiveClientPage({ params }: PredictiveClientPageProps) {
  await requireModuleAccess("clients");
  const session = await requireSession();
  const { clientId } = await params;
  const access = await checkPlanFeatureForSession(session, "ai_predictive_intelligence");

  if (!access.allowed) {
    return (
      <>
        <PageHeader title="Client Predictive Forecast" description="Client-level predictive forecasts." />
        <PageSurface>
          <ReportAIUpgradeCard
            message={getFeatureUpgradeMessage("ai_predictive_intelligence")}
            requiredPlanLabel={getRequiredPlanLabel("ai_predictive_intelligence")}
            title="Predictive Intelligence"
          />
        </PageSurface>
      </>
    );
  }

  const [analysis, summary, snapshots] = await Promise.all([
    getClientPredictiveAnalysis(session, clientId),
    getClientPredictiveSummary(session, clientId),
    listRecentPredictiveSnapshots(session.organization.id, 20),
  ]);

  if (!analysis && !summary) {
    notFound();
  }

  const clientSnapshots = snapshots.filter((row) => row.clientId === clientId);
  const clientName = summary?.clientName ?? analysis?.clientName ?? "Client";

  return (
    <>
      <PageHeader
        title={`Predictive — ${clientName}`}
        description="Client-level health, risk, incident, and churn forecasts."
        action={
          <Link href="/predictive" className={cn(linkText, "text-sm")}>
            Back to overview
          </Link>
        }
      />

      <PageSurface>
        {!summary || summary.confidence.score < 25 ? (
          <PredictiveEmptyState description={INSUFFICIENT_PREDICTIVE_DATA} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <PredictiveTrendBadge value={summary.trajectory} />
              <PredictiveConfidenceBadge confidence={summary.confidence} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <PredictiveCard title="Health forecast">
                <PredictiveHealthForecast analysis={analysis} summary={summary} />
              </PredictiveCard>
              <PredictiveCard title="Risk forecast">
                <PredictiveRiskForecast summary={summary} />
              </PredictiveCard>
              <PredictiveCard title="Incident forecast">
                <PredictiveIncidentForecast analysis={analysis} summary={summary} />
              </PredictiveCard>
              <PredictiveCard title="Churn risk">
                <PredictiveChurnCard analysis={analysis} summary={summary} />
              </PredictiveCard>
            </div>

            {analysis ? (
              <PredictiveClientPanel
                initialAnalysis={analysis}
                showRevenue={canViewRevenue(session.role)}
              />
            ) : null}

            <PredictiveCard title="Snapshot history">
              <PredictiveTimeline snapshots={clientSnapshots} />
            </PredictiveCard>
          </div>
        )}
      </PageSurface>
    </>
  );
}
