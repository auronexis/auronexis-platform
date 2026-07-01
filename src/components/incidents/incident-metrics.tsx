import type { IncidentSummary } from "@/lib/incidents/types";

type IncidentMetricsProps = {
  summary: IncidentSummary;
};

function formatMttr(hours: number | null): string {
  if (hours === null) {
    return "—";
  }

  if (hours < 1) {
    return "<1h";
  }

  return `${hours}h`;
}

export function IncidentMetrics({ summary }: IncidentMetricsProps) {
  const cards = [
    { label: "Open incidents", value: summary.openCount },
    { label: "Critical incidents", value: summary.criticalCount },
    { label: "MTTR", value: formatMttr(summary.mttrHours) },
    { label: "Resolved %", value: `${summary.resolvedPercent}%` },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border/70 bg-surface/60 p-4"
        >
          <p className="text-sm text-muted">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
