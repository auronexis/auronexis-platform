import Link from "next/link";
import type { ClientPredictiveSummary } from "@/lib/predictive/types";
import { PredictiveCard } from "@/components/predictive/predictive-card";
import { PredictiveChurnCard } from "@/components/predictive/predictive-churn-card";
import { PredictiveConfidenceBadge } from "@/components/predictive/predictive-confidence-badge";
import { PredictiveHealthForecast } from "@/components/predictive/predictive-health-forecast";
import { PredictiveIncidentForecast } from "@/components/predictive/predictive-incident-forecast";
import { PredictiveRiskForecast } from "@/components/predictive/predictive-risk-forecast";
import { PredictiveTrendBadge } from "@/components/predictive/predictive-trend-badge";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type PredictiveSummaryCardProps = {
  summary: ClientPredictiveSummary;
};

export function PredictiveSummaryCard({ summary }: PredictiveSummaryCardProps) {
  return (
    <PredictiveCard
      title="Predictive Summary"
      description="Deterministic forecasts from verified client signals."
      action={
        <Link href={`/predictive/${summary.clientId}`} className={cn(linkText, "text-xs")}>
          Full forecast
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <PredictiveTrendBadge value={summary.trajectory} />
        <PredictiveConfidenceBadge confidence={summary.confidence} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted">Health forecast</p>
          <PredictiveHealthForecast summary={summary} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Risk forecast</p>
          <PredictiveRiskForecast summary={summary} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Incident forecast</p>
          <PredictiveIncidentForecast summary={summary} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted">Churn risk</p>
          <PredictiveChurnCard summary={summary} />
        </div>
      </div>

      {summary.topConcerns.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted">Top concerns</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {summary.topConcerns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.recommendedActions.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted">Recommended actions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {summary.recommendedActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </PredictiveCard>
  );
}
