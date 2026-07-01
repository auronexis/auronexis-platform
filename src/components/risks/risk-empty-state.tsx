import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type RiskEmptyStateProps = {
  title?: string;
  description?: string;
};

export function RiskEmptyState({
  title = "No risks match this filter",
  description = "Risks will appear here when detected automatically or added manually.",
}: RiskEmptyStateProps) {
  return (
    <EmptyState icon={AlertTriangle} title={title} description={description} />
  );
}
