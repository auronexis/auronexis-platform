"use client";

import Link from "next/link";
import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import type { PipelineDashboardMetrics } from "@/lib/sales/queries";
import { cn } from "@/lib/utils/cn";

type MetricCard = {
  label: string;
  value: string;
  href?: string;
};

export function PipelineMetricCards({ metrics }: { metrics: PipelineDashboardMetrics }) {
  const { formatMoney } = useWorkspaceMoney();

  const cards: MetricCard[] = [
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
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
