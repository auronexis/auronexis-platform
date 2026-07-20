"use client";

import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import { MetricCardGrid } from "@/components/ui/metric-card-grid";
import type { PipelineDashboardMetrics } from "@/lib/sales/queries";

export function PipelineMetricCards({ metrics }: { metrics: PipelineDashboardMetrics }) {
  const { formatMoney } = useWorkspaceMoney();

  return (
    <MetricCardGrid
      columns="3"
      cards={[
        { label: "Total leads", value: String(metrics.totalLeads), href: "/sales/leads" },
        {
          label: "Qualified",
          value: String(metrics.qualifiedLeads),
          href: "/sales/leads?stage=qualified",
        },
        { label: "Open follow-ups", value: String(metrics.openFollowups), href: "/sales/leads" },
        { label: "Pipeline value", value: formatMoney(metrics.pipelineValue) },
        { label: "Won value", value: formatMoney(metrics.wonValue), href: "/sales/leads?stage=won" },
        { label: "Conversion", value: `${metrics.conversionRate}%` },
      ]}
    />
  );
}
