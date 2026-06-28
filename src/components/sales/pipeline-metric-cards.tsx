"use client";

import Link from "next/link";
import type { PipelineDashboardMetrics } from "@/lib/sales/queries";
import { cn } from "@/lib/utils/cn";

type MetricCard = {
  label: string;
  value: string;
  href?: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function PipelineMetricCards({ metrics }: { metrics: PipelineDashboardMetrics }) {
  const cards: MetricCard[] = [
    { label: "Leads", value: String(metrics.leads), href: "/sales/leads?stage=pilot_lead" },
    { label: "Pilots", value: String(metrics.pilots), href: "/sales/leads?stage=pilot_application" },
    { label: "Meetings", value: String(metrics.meetings), href: "/sales/leads?stage=discovery_call" },
    { label: "Opportunities", value: String(metrics.opportunities), href: "/sales/leads" },
    { label: "MRR Pipeline", value: formatCurrency(metrics.mrrPipeline) },
    { label: "Conversion", value: `${metrics.conversionRate}%` },
    { label: "Closed Won", value: String(metrics.closedWon), href: "/sales/leads?stage=won" },
    { label: "Closed Lost", value: String(metrics.closedLost), href: "/sales/leads?stage=lost" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const content = (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{card.value}</p>
          </>
        );

        if (card.href) {
          return (
            <Link
              key={card.label}
              href={card.href}
              className={cn("aurora-surface interactive-card-hover block p-5")}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={card.label} className="aurora-surface p-5">
            {content}
          </div>
        );
      })}
    </div>
  );
}
