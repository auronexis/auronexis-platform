type ExecutiveRecommendationsProps = {
  recommendations: string[];
  suggestedPriorities?: string[];
};

export function ExecutiveRecommendations({
  recommendations,
  suggestedPriorities = [],
}: ExecutiveRecommendationsProps) {
  const items = recommendations.length > 0 ? recommendations : suggestedPriorities;

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Executive recommendations</h4>
      {items.length > 0 ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No recommendations available yet.</p>
      )}
    </div>
  );
}
