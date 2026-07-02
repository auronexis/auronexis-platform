import { ExecutiveSummaryCard } from "@/components/executive-reports/executive-summary-card";
import { ExecutiveHighlights } from "@/components/executive-reports/executive-highlights";
import { ExecutiveKPIGrid } from "@/components/executive-reports/executive-kpi-grid";
import { PortalCard } from "@/components/client-portal/portal-ui";
import type { ExecutiveReportSnapshot } from "@/lib/executive-reports/types";
import { formatExecutiveReportTimestamp } from "@/lib/executive-reports/types";

type PortalExecutiveSummaryProps = {
  snapshot: ExecutiveReportSnapshot | null;
};

export function PortalExecutiveSummary({ snapshot }: PortalExecutiveSummaryProps) {
  if (!snapshot) {
    return (
      <PortalCard>
        <h2 className="text-lg font-semibold text-foreground">Executive overview</h2>
        <p className="mt-2 text-sm text-muted">
          Your agency will share an executive overview when a published report is available.
        </p>
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Executive overview</h2>
          <p className="mt-1 text-sm text-muted">Leadership summary from your latest published report.</p>
        </div>
        <p className="text-xs text-muted">Updated {formatExecutiveReportTimestamp(snapshot.generated_at)}</p>
      </div>
      <div className="mt-6 space-y-6">
        <ExecutiveSummaryCard summary={snapshot.executive_summary} />
        <ExecutiveKPIGrid metadata={snapshot.metadata} />
        <ExecutiveHighlights
          topConcerns={snapshot.metadata.topConcerns ?? []}
          positiveDevelopments={snapshot.metadata.positiveDevelopments ?? []}
          trendAnalysis={snapshot.metadata.trendAnalysis}
        />
      </div>
    </PortalCard>
  );
}
