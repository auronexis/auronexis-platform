type ApiEmptyStateProps = {
  title: string;
  description: string;
};

export function ApiEmptyState({ title, description }: ApiEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
