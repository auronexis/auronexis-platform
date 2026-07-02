type AIAnalysisEmptyStateProps = {
  title?: string;
  description?: string;
};

export function AIAnalysisEmptyState({
  title = "No AI analysis yet",
  description = "Generate an AI-assisted investigation summary to accelerate triage and resolution.",
}: AIAnalysisEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-8 text-center">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
