import { PredictiveClientPanel } from "@/components/predictive/predictive-client-panel";
import { PredictiveEmptyState } from "@/components/predictive/predictive-empty-state";
import { PredictiveSummaryCard } from "@/components/predictive/predictive-summary-card";
import { ReportAIUpgradeCard } from "@/components/reports/ai/report-ai-usage-card";
import { DetailSection } from "@/components/layout/detail-page";
import { getClientPredictiveAnalysis } from "@/lib/predictive/cache";
import { getClientPredictiveSummary } from "@/lib/predictive/summary";
import { INSUFFICIENT_PREDICTIVE_DATA } from "@/lib/predictive/types";
import { requireSession } from "@/lib/auth/session";
import {
  checkPlanFeatureForSession,
  getFeatureUpgradeMessage,
  getRequiredPlanLabel,
} from "@/lib/plans";
import { canViewRevenue } from "@/lib/rbac/permissions";

type PredictiveIntelligenceSectionProps = {
  clientId: string;
};

export async function PredictiveIntelligenceSection({ clientId }: PredictiveIntelligenceSectionProps) {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "ai_predictive_intelligence");

  if (!access.allowed) {
    return (
      <DetailSection
        title="Predictive Intelligence"
        description="Deterministic forecasts from verified client history."
      >
        <ReportAIUpgradeCard
          message={getFeatureUpgradeMessage("ai_predictive_intelligence")}
          requiredPlanLabel={getRequiredPlanLabel("ai_predictive_intelligence")}
          title="Predictive Intelligence"
        />
      </DetailSection>
    );
  }

  const [analysis, summary] = await Promise.all([
    getClientPredictiveAnalysis(session, clientId),
    getClientPredictiveSummary(session, clientId),
  ]);

  if (!analysis && !summary) {
    return (
      <DetailSection title="Predictive Intelligence">
        <PredictiveEmptyState description={INSUFFICIENT_PREDICTIVE_DATA} />
      </DetailSection>
    );
  }

  if (!summary || summary.confidence.score < 25) {
    return (
      <DetailSection title="Predictive Intelligence">
        <PredictiveEmptyState description={INSUFFICIENT_PREDICTIVE_DATA} />
      </DetailSection>
    );
  }

  return (
    <DetailSection
      title="Predictive Intelligence"
      description="Trajectory, trends, confidence, and recommended actions from verified signals."
    >
      <div className="space-y-6">
        <PredictiveSummaryCard summary={summary} />
        {analysis ? (
          <PredictiveClientPanel
            initialAnalysis={analysis}
            showRevenue={canViewRevenue(session.role)}
          />
        ) : null}
      </div>
    </DetailSection>
  );
}
