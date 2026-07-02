import Link from "next/link";
import { AIAnalysisEmptyState } from "@/components/incidents/ai/ai-analysis-empty-state";
import { GenerateAnalysisButton } from "@/components/incidents/ai/generate-analysis-button";
import { IncidentAIConfidenceBadge } from "@/components/incidents/ai/incident-ai-confidence-badge";
import { IncidentAIHistory } from "@/components/incidents/ai/incident-ai-history";
import { IncidentAIRecommendations } from "@/components/incidents/ai/incident-ai-recommendations";
import { IncidentAIRootCauseCard } from "@/components/incidents/ai/incident-ai-root-cause-card";
import { IncidentAISummaryCard } from "@/components/incidents/ai/incident-ai-summary-card";
import { DetailSection } from "@/components/layout/detail-page";
import type { IncidentAIAnalysis } from "@/lib/ai-incidents/types";
import { formatIncidentAITimestamp } from "@/lib/ai-incidents/types";
import { linkText } from "@/lib/ui/tokens";

type IncidentAISectionProps = {
  incidentId: string;
  latestAnalysis: IncidentAIAnalysis | null;
  history: IncidentAIAnalysis[];
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel: string;
};

export function IncidentAISection({
  incidentId,
  latestAnalysis,
  history,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: IncidentAISectionProps) {
  const nextSteps =
    typeof latestAnalysis?.metadata?.nextSteps === "string"
      ? latestAnalysis.metadata.nextSteps
      : null;

  return (
    <DetailSection
      title="AI incident assistant"
      description="Investigation support using verified incident, monitoring, risk, and SLA context."
      action={
        aiEnabled ? (
          <GenerateAnalysisButton incidentId={incidentId} label="Regenerate analysis" />
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
            <IncidentAIConfidenceBadge confidence={latestAnalysis.confidence} />
            <span className="text-xs text-muted">
              Generated {formatIncidentAITimestamp(latestAnalysis.created_at)} · {latestAnalysis.provider}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <IncidentAISummaryCard summary={latestAnalysis.summary} />
            <IncidentAIRootCauseCard rootCause={latestAnalysis.root_cause} />
          </div>

          <IncidentAIRecommendations
            recommendations={latestAnalysis.recommendations}
            nextSteps={nextSteps}
          />

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">History</h4>
            <div className="mt-3">
              <IncidentAIHistory analyses={history} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AIAnalysisEmptyState />
          <GenerateAnalysisButton incidentId={incidentId} />
        </div>
      )}
    </DetailSection>
  );
}
