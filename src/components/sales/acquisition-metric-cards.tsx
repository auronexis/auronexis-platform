import Link from "next/link";
import type { AcquisitionDashboardMetrics } from "@/lib/sales/acquisition-metrics";

type AcquisitionMetricCardsProps = {
  metrics: AcquisitionDashboardMetrics;
};

export function AcquisitionMetricCards({ metrics }: AcquisitionMetricCardsProps) {
  const cards = [
    { label: "New leads (30d)", value: String(metrics.newLeads), href: "/sales/leads" },
    { label: "Qualified", value: String(metrics.qualified), href: "/sales/leads?stage=qualified" },
    { label: "Meetings booked", value: String(metrics.meetingsBooked), href: "/sales/leads?stage=discovery_call" },
    { label: "Open opportunities", value: String(metrics.openOpportunities), href: "/sales/leads" },
    { label: "Pilot applications", value: String(metrics.pilotApplications), href: "/sales/leads?stage=pilot_application" },
    { label: "Pipeline value", value: `$${metrics.pipelineValue.toLocaleString()}`, href: "/sales/acquisition" },
    { label: "MRR forecast", value: `$${metrics.mrrForecast.toLocaleString()}`, href: "/sales/acquisition" },
    { label: "ARR forecast", value: `$${metrics.arrForecast.toLocaleString()}`, href: "/sales/acquisition" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="aurora-surface block p-4 transition-colors hover:border-primary/20"
        >
          <p className="text-xs uppercase tracking-wider text-muted">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
        </Link>
      ))}
    </div>
  );
}
