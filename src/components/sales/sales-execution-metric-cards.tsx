"use client";

import Link from "next/link";
import { useWorkspaceMoney } from "@/components/workspace/workspace-money-provider";
import type { SalesExecutionMetrics } from "@/lib/sales/sales-execution-metrics";

export function SalesExecutionMetricCards({ metrics }: { metrics: SalesExecutionMetrics }) {
  const { formatMoney } = useWorkspaceMoney();

  const cards = [
    { label: "Outreach sent", value: String(metrics.outreachSent) },
    { label: "Replies", value: String(metrics.replies) },
    { label: "Meetings", value: String(metrics.meetings) },
    { label: "Discovery calls", value: String(metrics.discoveryCalls) },
    { label: "Pilots", value: String(metrics.pilots) },
    { label: "Won deals", value: String(metrics.wonDeals), href: "/sales/leads?stage=won" },
    { label: "MRR", value: formatMoney(metrics.mrr) },
    { label: "ARR", value: formatMoney(metrics.arr) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) =>
        card.href ? (
          <Link key={card.label} href={card.href} className="aurora-surface block p-4 hover:border-primary/20">
            <CardContent {...card} />
          </Link>
        ) : (
          <div key={card.label} className="aurora-surface p-4">
            <CardContent {...card} />
          </div>
        ),
      )}
    </div>
  );
}

function CardContent({ label, value }: { label: string; value: string }) {
  return (
    <>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </>
  );
}
