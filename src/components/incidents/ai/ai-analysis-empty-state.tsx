import { CompactEmptyState } from "@/components/ui/compact-empty-state";

type AIAnalysisEmptyStateProps = {
  title?: string;
  description?: string;
};

export function AIAnalysisEmptyState({
  title = "No AI analysis yet",
  description = "Generate an AI-assisted investigation summary to accelerate triage and resolution.",
}: AIAnalysisEmptyStateProps) {
  return <CompactEmptyState title={title} description={description} />;
}
