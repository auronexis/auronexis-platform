type RiskAIRecommendationsProps = {
  actions: string[];
};

export function RiskAIRecommendations({ actions }: RiskAIRecommendationsProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended actions</h4>
      {actions.length > 0 ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
          {actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">No recommendations available yet.</p>
      )}
    </div>
  );
}
