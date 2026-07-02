type ExecutiveEmptyStateProps = {
  title?: string;
  description?: string;
};

export function ExecutiveEmptyState({
  title = "No executive report yet",
  description = "Generate an executive report to produce leadership-ready summaries, KPIs, and recommendations.",
}: ExecutiveEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
