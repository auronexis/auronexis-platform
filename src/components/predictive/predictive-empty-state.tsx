import { TrendingUp } from "lucide-react";

type PredictiveEmptyStateProps = {
  title?: string;
  description?: string;
};

export function PredictiveEmptyState({
  title = "Not enough data for predictions",
  description = "Predictions require verified client history — health, incidents, risks, or published reports.",
}: PredictiveEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-8 text-center">
      <TrendingUp className="mx-auto h-8 w-8 text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
