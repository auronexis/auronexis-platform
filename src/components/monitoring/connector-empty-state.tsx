type ConnectorEmptyStateProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function ConnectorEmptyState({
  title = "No monitoring connectors yet",
  description = "Add a connector to start collecting operational signals from your stack.",
  action,
}: ConnectorEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-muted/5 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
