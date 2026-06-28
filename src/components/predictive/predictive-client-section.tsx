import { PredictiveClientPanel } from "@/components/predictive/predictive-client-panel";
import { ReportAIUpgradeCard } from "@/components/reports/ai/report-ai-usage-card";
import { DetailSection } from "@/components/layout/detail-page";
import { getClientPredictiveAnalysis } from "@/lib/predictive/cache";
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
  const analysis = access.allowed ? await getClientPredictiveAnalysis(session, clientId) : null;

  return (
    <DetailSection
      title="Predictive Intelligence"
      description="Deterministic forecasts from verified client history — churn, health, communication, incidents, and recommendations."
    >
      {!access.allowed ? (
        <ReportAIUpgradeCard
          message={getFeatureUpgradeMessage("ai_predictive_intelligence")}
          requiredPlanLabel={getRequiredPlanLabel("ai_predictive_intelligence")}
          title="Predictive Intelligence"
        />
      ) : !analysis ? (
        <p className="text-sm text-muted">{INSUFFICIENT_PREDICTIVE_DATA}</p>
      ) : analysis.confidence.score < 25 ? (
        <p className="text-sm text-muted">{INSUFFICIENT_PREDICTIVE_DATA}</p>
      ) : (
        <PredictiveClientPanel
          initialAnalysis={analysis}
          showRevenue={canViewRevenue(session.role)}
        />
      )}
    </DetailSection>
  );
}
