"use client";

import Link from "next/link";
import type { PredictiveDashboardSummary } from "@/lib/predictive/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type PredictiveForecastHubCardProps = {
  summary: PredictiveDashboardSummary;
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

const TREND_LABELS: Record<PredictiveDashboardSummary["revenueTrend"], string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
  unknown: "Unknown",
};

export function PredictiveForecastHubCard({
  summary,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: PredictiveForecastHubCardProps) {
  if (!aiEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
        <p className="text-sm font-semibold text-foreground">Predictive Forecast</p>
        <p className="mt-2 text-sm text-muted">{upgradeMessage}</p>
        {requiredPlanLabel ? (
          <p className="mt-1 text-xs font-medium text-foreground">{requiredPlanLabel} plan required</p>
        ) : null}
      </div>
    );
  }

  const items = [
    { label: "Customers at risk", value: summary.customersAtRisk },
    { label: "Predicted SLA breaches", value: summary.predictedSlaBreaches },
    { label: "Predicted incidents", value: summary.predictedIncidents },
    { label: "Revenue trend", value: TREND_LABELS[summary.revenueTrend] },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Avg confidence:{" "}
        <span className="font-medium text-foreground">{summary.averageConfidence}%</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface/80 px-4 py-3">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
      <Link href="/dashboard/predictive" className={cn(linkText, "inline-flex text-sm")}>
        Open predictive workspace
      </Link>
    </div>
  );
}
