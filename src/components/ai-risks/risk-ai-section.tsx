import Link from "next/link";
import { GenerateRiskAnalysisButton } from "@/components/ai-risks/generate-risk-analysis-button";
import { RiskAIConfidenceBadge } from "@/components/ai-risks/risk-ai-confidence-badge";
import { RiskAIEmptyState } from "@/components/ai-risks/risk-ai-empty-state";
import { RiskAIHistory } from "@/components/ai-risks/risk-ai-history";
import { RiskAIMitigationPlan } from "@/components/ai-risks/risk-ai-mitigation-plan";
import { RiskAIReasoningCard } from "@/components/ai-risks/risk-ai-reasoning-card";
import { RiskAIRecommendations } from "@/components/ai-risks/risk-ai-recommendations";
import { RiskAISummaryCard } from "@/components/ai-risks/risk-ai-summary-card";
import { DetailSection } from "@/components/layout/detail-page";
import { RiskSeverityBadge } from "@/components/risks/risk-severity-badge";
import type { RiskAIAnalysis } from "@/lib/ai-risks/types";
import { formatRiskAITimestamp } from "@/lib/ai-risks/types";
import { RISK_SEVERITIES, type RiskSeverity } from "@/lib/risks/types";
import { linkText } from "@/lib/ui/tokens";

function isRiskSeverity(value: string | null | undefined): value is RiskSeverity {
  return value != null && RISK_SEVERITIES.includes(value as RiskSeverity);
}

type RiskAISectionProps = {
  riskId: string;
  latestAnalysis: RiskAIAnalysis | null;
  history: RiskAIAnalysis[];
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel: string;
};

export function RiskAISection({
  riskId,
  latestAnalysis,
  history,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: RiskAISectionProps) {
  return (
    <DetailSection
      title="AI risk assistant"
      description="Risk prioritization support using verified client, health, incident, and SLA context."
      action={
        aiEnabled ? (
          <GenerateRiskAnalysisButton riskId={riskId} label="Regenerate analysis" />
        ) : (
          <Link href="/settings/plans" className={linkText}>
            Upgrade to {requiredPlanLabel}
          </Link>
        )
      }
    >
      {!aiEnabled ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-6 text-center">
          <p className="text-sm text-muted">{upgradeMessage}</p>
        </div>
      ) : latestAnalysis ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <RiskAIConfidenceBadge confidence={latestAnalysis.confidence} />
            <span className="text-xs text-muted">
              Generated {formatRiskAITimestamp(latestAnalysis.created_at)} · {latestAnalysis.provider}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 bg-surface/40 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Predicted severity</p>
              <div className="mt-1">
                {isRiskSeverity(latestAnalysis.predicted_severity) ? (
                  <RiskSeverityBadge severity={latestAnalysis.predicted_severity} />
                ) : latestAnalysis.predicted_severity ? (
                  <span className="text-sm capitalize text-foreground">{latestAnalysis.predicted_severity}</span>
                ) : (
                  <span className="text-sm text-muted">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Predicted score</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {latestAnalysis.predicted_score ?? "—"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RiskAISummaryCard summary={latestAnalysis.summary} />
            <RiskAIReasoningCard reasoning={latestAnalysis.risk_reasoning} />
          </div>

          <RiskAIMitigationPlan mitigationPlan={latestAnalysis.mitigation_plan} />
          <RiskAIRecommendations actions={latestAnalysis.recommended_actions} />

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">History</h4>
            <div className="mt-3">
              <RiskAIHistory analyses={history} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <RiskAIEmptyState />
          <GenerateRiskAnalysisButton riskId={riskId} />
        </div>
      )}
    </DetailSection>
  );
}
