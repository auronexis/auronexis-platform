type ExecutiveHighlightsProps = {
  topConcerns: string[];
  positiveDevelopments: string[];
  trendAnalysis?: string | null;
};

export function ExecutiveHighlights({
  topConcerns,
  positiveDevelopments,
  trendAnalysis,
}: ExecutiveHighlightsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Top concerns</h4>
        {topConcerns.length > 0 ? (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground">
            {topConcerns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No major concerns identified.</p>
        )}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Positive developments</h4>
        {positiveDevelopments.length > 0 ? (
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground">
            {positiveDevelopments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">No notable positive developments recorded.</p>
        )}
      </div>

      {trendAnalysis ? (
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-4 lg:col-span-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Trend analysis</h4>
          <p className="mt-3 text-sm leading-relaxed text-foreground">{trendAnalysis}</p>
        </div>
      ) : null}
    </div>
  );
}
