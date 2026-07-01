import type { RiskSummary } from "@/lib/risks/types";

type RiskMetricsProps = {
  summary: RiskSummary;
};

function formatAverage(score: number | null): string {
  if (score === null) {
    return "—";
  }

  return String(score);
}

export function RiskMetrics({ summary }: RiskMetricsProps) {
  const cards = [
    { label: "Open risks", value: summary.openCount },
    { label: "Critical risks", value: summary.criticalCount },
    { label: "High score (≥12)", value: summary.highScoreCount },
    { label: "Overdue", value: summary.overdueCount },
    { label: "Mitigation rate", value: `${summary.mitigationRate}%` },
    { label: "Avg risk score", value: formatAverage(summary.averageRiskScore) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
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
