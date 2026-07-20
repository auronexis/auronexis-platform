"use client";

import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import { MetricCardGrid } from "@/components/ui/metric-card-grid";
import type { SalesExecutionMetrics } from "@/lib/sales/sales-execution-metrics";

export function SalesExecutionMetricCards({ metrics }: { metrics: SalesExecutionMetrics }) {
  const { formatMoney } = useWorkspaceMoney();

  return (
    <MetricCardGrid
      cards={[
        { label: "Outreach sent", value: String(metrics.outreachSent) },
        { label: "Replies", value: String(metrics.replies) },
        { label: "Meetings", value: String(metrics.meetings) },
        { label: "Discovery calls", value: String(metrics.discoveryCalls) },
        { label: "Pilots", value: String(metrics.pilots) },
        { label: "Won deals", value: String(metrics.wonDeals), href: "/sales/leads?stage=won" },
        { label: "MRR", value: formatMoney(metrics.mrr) },
        { label: "ARR", value: formatMoney(metrics.arr) },
      ]}
    />
  );
}
