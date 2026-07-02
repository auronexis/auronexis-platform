type IncidentAIRecommendationsProps = {
  recommendations: string | null;
  nextSteps?: string | null;
};

export function IncidentAIRecommendations({
  recommendations,
  nextSteps,
}: IncidentAIRecommendationsProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended actions</h4>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {recommendations ?? "No recommendations available yet."}
      </p>
      {nextSteps ? (
        <>
          <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Next steps</h4>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{nextSteps}</p>
        </>
      ) : null}
    </div>
  );
}
