type RiskAISummaryCardProps = {
  summary: string | null;
};

export function RiskAISummaryCard({ summary }: RiskAISummaryCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Executive summary</h4>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {summary ?? "No AI summary available yet."}
      </p>
    </div>
  );
}
