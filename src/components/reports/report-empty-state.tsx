type ReportEmptyStateProps = {
  title: string;
  description: string;
};

export function ReportEmptyState({ title, description }: ReportEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border-subtle bg-muted/5 px-6 py-12 text-center">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
