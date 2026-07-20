import { CompactEmptyState } from "@/components/ui/compact-empty-state";

type RiskAIEmptyStateProps = {
  title?: string;
  description?: string;
};

export function RiskAIEmptyState({
  title = "No AI analysis yet",
  description = "Generate an AI-assisted risk summary to prioritize mitigation and next actions.",
}: RiskAIEmptyStateProps) {
  return <CompactEmptyState title={title} description={description} />;
}
