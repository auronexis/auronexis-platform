import { ExecutiveHighlights } from "@/components/executive-reports/executive-highlights";
import { ExecutiveKPIGrid } from "@/components/executive-reports/executive-kpi-grid";
import { ExecutiveRecommendations } from "@/components/executive-reports/executive-recommendations";
import { ExecutiveSummaryCard } from "@/components/executive-reports/executive-summary-card";
import { PortalCard } from "@/components/client-portal/portal-ui";
import type { ExecutiveReportSnapshot } from "@/lib/executive-reports/types";
import { formatExecutiveReportTimestamp } from "@/lib/executive-reports/types";

type PortalExecutiveOverviewProps = {
  snapshot: ExecutiveReportSnapshot | null;
};

export function PortalExecutiveOverview({ snapshot }: PortalExecutiveOverviewProps) {
  if (!snapshot) {
    return (
      <PortalCard>
        <h2 className="text-lg font-semibold text-foreground">Executive overview</h2>
        <p className="mt-2 text-sm text-muted">
          Your agency has not shared an executive overview for a published report yet.
        </p>
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Executive overview</h2>
          <p className="mt-1 text-sm text-muted">
            Read-only leadership summary from your latest published report.
          </p>
        </div>
        <p className="text-xs text-muted">
          Updated {formatExecutiveReportTimestamp(snapshot.generated_at)}
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <ExecutiveSummaryCard summary={snapshot.executive_summary} />
        <ExecutiveKPIGrid metadata={snapshot.metadata} />
        <ExecutiveHighlights
          topConcerns={snapshot.metadata.topConcerns ?? []}
          positiveDevelopments={snapshot.metadata.positiveDevelopments ?? []}
          trendAnalysis={snapshot.metadata.trendAnalysis}
        />
        <ExecutiveRecommendations
          recommendations={snapshot.metadata.executiveRecommendations ?? []}
          suggestedPriorities={snapshot.metadata.suggestedPriorities}
        />
      </div>
    </PortalCard>
  );
}
