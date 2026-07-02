type RiskAIMitigationPlanProps = {
  mitigationPlan: string | null;
};

export function RiskAIMitigationPlan({ mitigationPlan }: RiskAIMitigationPlanProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Mitigation plan</h4>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {mitigationPlan ?? "No AI mitigation plan available yet."}
      </p>
    </div>
  );
}
