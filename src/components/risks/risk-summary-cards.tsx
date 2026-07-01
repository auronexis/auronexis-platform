import type { RiskSummary } from "@/lib/risks/types";

type RiskSummaryCardsProps = {
  summary: RiskSummary;
};

export function RiskSummaryCards({ summary }: RiskSummaryCardsProps) {
  const cards = [
    { label: "Open", value: summary.openCount },
    { label: "Critical", value: summary.criticalCount },
    { label: "High", value: summary.highCount },
    { label: "Due soon", value: summary.dueSoonCount },
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
