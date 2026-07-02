import { ExecutiveEmptyState } from "@/components/executive-reports/executive-empty-state";
import { ExecutiveHighlights } from "@/components/executive-reports/executive-highlights";
import { ExecutiveKPIGrid } from "@/components/executive-reports/executive-kpi-grid";
import { ExecutiveMetrics } from "@/components/executive-reports/executive-metrics";
import { ExecutiveRecommendations } from "@/components/executive-reports/executive-recommendations";
import { ExecutiveSummaryCard } from "@/components/executive-reports/executive-summary-card";
import { ExecutiveTimeline } from "@/components/executive-reports/executive-timeline";
import { GenerateExecutiveReportButton } from "@/components/executive-reports/generate-executive-report-button";
import { DetailSection } from "@/components/layout/detail-page";
import type { ExecutiveReportSnapshot } from "@/lib/executive-reports/types";
import { formatExecutiveReportTimestamp } from "@/lib/executive-reports/types";

type ExecutiveReportViewerProps = {
  reportId: string;
  snapshot: ExecutiveReportSnapshot | null;
  canGenerate: boolean;
};

export function ExecutiveReportViewer({
  reportId,
  snapshot,
  canGenerate,
}: ExecutiveReportViewerProps) {
  return (
    <DetailSection
      title="Executive deliverable"
      description="Leadership-ready summary synthesized from health, risk, incident, SLA, monitoring, and AI insights."
      action={
        canGenerate ? (
          <GenerateExecutiveReportButton
            reportId={reportId}
            label={snapshot ? "Regenerate executive report" : "Generate executive report"}
          />
        ) : null
      }
    >
      {!snapshot ? (
        <div className="space-y-4">
          <ExecutiveEmptyState />
          {canGenerate ? <GenerateExecutiveReportButton reportId={reportId} /> : null}
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-xs text-muted">
            Generated {formatExecutiveReportTimestamp(snapshot.generated_at)}
          </p>

          <ExecutiveSummaryCard summary={snapshot.executive_summary} />
          <ExecutiveKPIGrid metadata={snapshot.metadata} />
          <ExecutiveMetrics
            riskSummary={snapshot.risk_summary}
            incidentSummary={snapshot.incident_summary}
            slaSummary={snapshot.sla_summary}
            monitoringSummary={snapshot.monitoring_summary}
            aiSummary={snapshot.ai_summary}
          />
          <ExecutiveHighlights
            topConcerns={snapshot.metadata.topConcerns ?? []}
            positiveDevelopments={snapshot.metadata.positiveDevelopments ?? []}
            trendAnalysis={snapshot.metadata.trendAnalysis}
          />
          <ExecutiveRecommendations
            recommendations={snapshot.metadata.executiveRecommendations ?? []}
            suggestedPriorities={snapshot.metadata.suggestedPriorities}
          />
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Timeline</h4>
            <div className="mt-3">
              <ExecutiveTimeline items={snapshot.metadata.timeline ?? []} />
            </div>
          </div>
        </div>
      )}
    </DetailSection>
  );
}
