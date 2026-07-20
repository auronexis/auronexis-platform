import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type PredictiveEmptyStateProps = {
  title?: string;
  description?: string;
};

export function PredictiveEmptyState({
  title = "Not enough data for predictions",
  description = "Predictions require verified client history — health, incidents, risks, or published reports.",
}: PredictiveEmptyStateProps) {
  return <EmptyState icon={TrendingUp} title={title} description={description} />;
}
