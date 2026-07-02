import Link from "next/link";
import type {
  PredictiveIntelligenceResult,
  PredictiveMetrics,
  PredictiveSummary,
} from "@/lib/predictive/types";
import { PredictiveCard } from "@/components/predictive/predictive-card";
import { PredictiveConfidenceBadge } from "@/components/predictive/predictive-confidence-badge";
import { PredictiveEmptyState } from "@/components/predictive/predictive-empty-state";
import { PredictiveTrendBadge } from "@/components/predictive/predictive-trend-badge";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type PredictiveOverviewProps = {
  summary: PredictiveSummary;
  intelligence: PredictiveIntelligenceResult;
  metrics: PredictiveMetrics;
};

export function PredictiveOverview({ summary, intelligence, metrics }: PredictiveOverviewProps) {
  if (intelligence.forecastCount === 0 && summary.topDecliningClients.length === 0) {
    return <PredictiveEmptyState />;
  }

  const kpis = [
    { label: "Clients declining", value: metrics.clientsDeclining },
    { label: "Predicted incidents", value: metrics.predictedIncidents },
    { label: "Predicted breaches", value: metrics.predictedBreaches },
    { label: "High churn risk", value: metrics.highChurnRisk },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <PredictiveTrendBadge value={metrics.trajectory} />
          <p className="mt-2 text-sm text-foreground">{summary.executiveOverview}</p>
        </div>
        <PredictiveConfidenceBadge confidence={metrics.averageConfidence} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-surface/80 px-4 py-3">
            <p className="text-xs text-muted">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {metrics.forecastAccuracy != null ? (
        <p className="text-xs text-muted">
          Forecast accuracy (historical): {metrics.forecastAccuracy}%
        </p>
      ) : null}

      <PredictiveCard
        title="Top declining clients"
        description="Accounts with declining or critical trajectory."
      >
        {summary.topDecliningClients.length === 0 ? (
          <p className="text-sm text-muted">No declining clients detected.</p>
        ) : (
          <ul className="space-y-2">
            {summary.topDecliningClients.map((client) => (
              <li
                key={client.clientId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <Link href={client.href} className={cn(linkText, "text-sm font-medium")}>
                  {client.clientName}
                </Link>
                <div className="flex items-center gap-2">
                  <PredictiveTrendBadge value={client.trajectory} />
                  <span className="text-xs text-muted">Health {client.predictedHealth}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PredictiveCard>
    </div>
  );
}
