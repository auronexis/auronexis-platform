import type { ClientPredictiveAnalysis, ClientPredictiveSummary } from "@/lib/predictive/types";
import { PredictiveTrendBadge } from "@/components/predictive/predictive-trend-badge";

type PredictiveIncidentForecastProps = {
  analysis?: ClientPredictiveAnalysis | null;
  summary?: ClientPredictiveSummary | null;
};

export function PredictiveIncidentForecast({ analysis, summary }: PredictiveIncidentForecastProps) {
  const probability = analysis?.incidentForecast.current ?? null;
  const predictedCount = summary?.predictedIncidents ?? null;
  const trend = summary?.incidentTrend ?? "unknown";

  if (probability == null && predictedCount == null) {
    return <p className="text-sm text-muted">Incident forecast unavailable.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-semibold text-foreground">
          {predictedCount != null ? predictedCount : `${probability}%`}
        </p>
        <PredictiveTrendBadge value={trend} />
      </div>
      <p className="text-sm text-muted">
        {predictedCount != null
          ? "Predicted incidents (next period)"
          : `Incident probability ${probability}%`}
      </p>
    </div>
  );
}
