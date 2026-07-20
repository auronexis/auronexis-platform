"use client";

import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import { MetricCardGrid } from "@/components/ui/metric-card-grid";
import type { AcquisitionDashboardMetrics } from "@/lib/sales/acquisition-metrics";

type AcquisitionMetricCardsProps = {
  metrics: AcquisitionDashboardMetrics;
};

export function AcquisitionMetricCards({ metrics }: AcquisitionMetricCardsProps) {
  const { formatMoney } = useWorkspaceMoney();

  return (
    <MetricCardGrid
      cards={[
        { label: "New leads (30d)", value: String(metrics.newLeads), href: "/sales/leads" },
        { label: "Qualified", value: String(metrics.qualified), href: "/sales/leads?stage=qualified" },
        {
          label: "Meetings booked",
          value: String(metrics.meetingsBooked),
          href: "/sales/leads?stage=discovery_call",
        },
        { label: "Open opportunities", value: String(metrics.openOpportunities), href: "/sales/leads" },
        {
          label: "Pilot applications",
          value: String(metrics.pilotApplications),
          href: "/sales/leads?stage=pilot_application",
        },
        { label: "Pipeline value", value: formatMoney(metrics.pipelineValue), href: "/sales/acquisition" },
        { label: "MRR forecast", value: formatMoney(metrics.mrrForecast), href: "/sales/acquisition" },
        { label: "ARR forecast", value: formatMoney(metrics.arrForecast), href: "/sales/acquisition" },
      ]}
    />
  );
}
