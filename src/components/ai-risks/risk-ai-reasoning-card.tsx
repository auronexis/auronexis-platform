type RiskAIReasoningCardProps = {
  reasoning: string | null;
};

export function RiskAIReasoningCard({ reasoning }: RiskAIReasoningCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Why this risk matters</h4>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {reasoning ?? "No AI reasoning available yet."}
      </p>
    </div>
  );
}
