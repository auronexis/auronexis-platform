import type { ClientPredictiveAnalysis, ClientPredictiveSummary } from "@/lib/predictive/types";
import { PredictiveConfidenceBadge } from "@/components/predictive/predictive-confidence-badge";
import { PredictiveTrendBadge } from "@/components/predictive/predictive-trend-badge";

type PredictiveHealthForecastProps = {
  analysis?: ClientPredictiveAnalysis | null;
  summary?: ClientPredictiveSummary | null;
};

export function PredictiveHealthForecast({ analysis, summary }: PredictiveHealthForecastProps) {
  const current = analysis?.healthForecast.current ?? summary?.predictedHealth ?? null;
  const projected = analysis?.healthForecast.projected ?? summary?.predictedHealth ?? null;
  const trend = summary?.healthTrend ?? analysis?.trends[0]?.trend ?? "unknown";
  const confidence = analysis?.confidence ?? summary?.confidence;

  if (current == null) {
    return <p className="text-sm text-muted">Health forecast unavailable.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xl font-semibold text-foreground">{projected ?? current}</p>
        <PredictiveTrendBadge value={trend} />
      </div>
      <p className="text-sm text-muted">
        Current {current}
        {projected != null && projected !== current ? ` → projected ${projected}` : null}
      </p>
      {confidence ? <PredictiveConfidenceBadge confidence={confidence} /> : null}
    </div>
  );
}
