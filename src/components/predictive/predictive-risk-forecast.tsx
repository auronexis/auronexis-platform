import type { ClientPredictiveSummary } from "@/lib/predictive/types";
import { PredictiveTrendBadge } from "@/components/predictive/predictive-trend-badge";

type PredictiveRiskForecastProps = {
  summary: ClientPredictiveSummary | null;
};

export function PredictiveRiskForecast({ summary }: PredictiveRiskForecastProps) {
  if (!summary) {
    return <p className="text-sm text-muted">Risk forecast unavailable.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-semibold text-foreground">{summary.predictedRisk ?? "—"}</p>
        <PredictiveTrendBadge value={summary.riskTrend} />
      </div>
      <p className="text-sm text-muted">Predicted risk score (0–100)</p>
    </div>
  );
}
