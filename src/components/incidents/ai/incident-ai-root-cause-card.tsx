type IncidentAIRootCauseCardProps = {
  rootCause: string | null;
};

export function IncidentAIRootCauseCard({ rootCause }: IncidentAIRootCauseCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Possible root cause</h4>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {rootCause ?? "No root cause analysis available yet."}
      </p>
    </div>
  );
}
