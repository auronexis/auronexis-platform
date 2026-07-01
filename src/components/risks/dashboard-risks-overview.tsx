import Link from "next/link";
import { RiskHeatmap } from "@/components/risks/risk-heatmap";
import type { RiskHeatmap as RiskHeatmapData, RiskSummary } from "@/lib/risks/types";
import { linkText } from "@/lib/ui/tokens";

type DashboardRisksOverviewProps = {
  summary: RiskSummary;
  heatmap?: RiskHeatmapData;
};

export function DashboardRisksOverview({ summary, heatmap }: DashboardRisksOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">Open risks</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.openCount}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">Critical risks</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.criticalCount}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">High score (≥12)</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.highScoreCount}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">Overdue</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.overdueCount}</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">Mitigation rate</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{summary.mitigationRate}%</p>
        </div>
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm text-muted">Avg risk score</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {summary.averageRiskScore ?? "—"}
          </p>
        </div>
      </div>
      {heatmap ? (
        <div className="rounded-lg border border-border/70 bg-surface/60 p-4">
          <p className="text-sm font-medium text-foreground">Heatmap preview</p>
          <div className="mt-3">
            <RiskHeatmap heatmap={heatmap} compact />
          </div>
        </div>
      ) : null}
      <Link href="/risks" className={linkText}>
        View risk center →
      </Link>
    </div>
  );
}
