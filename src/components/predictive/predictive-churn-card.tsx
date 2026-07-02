import type { ClientPredictiveAnalysis, ClientPredictiveSummary } from "@/lib/predictive/types";
import { PredictiveTrendBadge } from "@/components/predictive/predictive-trend-badge";
import { cn } from "@/lib/utils/cn";

type PredictiveChurnCardProps = {
  analysis?: ClientPredictiveAnalysis | null;
  summary?: ClientPredictiveSummary | null;
};

export function PredictiveChurnCard({ analysis, summary }: PredictiveChurnCardProps) {
  const churn = summary?.churnProbability ?? analysis?.churnProbability ?? null;
  const trajectory = summary?.trajectory;

  if (churn == null) {
    return <p className="text-sm text-muted">Churn forecast unavailable.</p>;
  }

  const tone =
    churn >= 70 ? "text-danger" : churn >= 45 ? "text-warning" : "text-foreground";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-2xl font-semibold", tone)}>{churn}%</p>
        {trajectory ? <PredictiveTrendBadge value={trajectory} /> : null}
      </div>
      <p className="text-sm text-muted">Churn probability from verified signals</p>
      {analysis?.churnSegment ? (
        <p className="text-xs text-muted capitalize">{analysis.churnSegment.replace("_", " ")}</p>
      ) : null}
    </div>
  );
}
