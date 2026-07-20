import { CompactEmptyState } from "@/components/ui/compact-empty-state";

type ExecutiveEmptyStateProps = {
  title?: string;
  description?: string;
};

export function ExecutiveEmptyState({
  title = "No executive report yet",
  description = "Generate an executive report to produce leadership-ready summaries, KPIs, and recommendations.",
}: ExecutiveEmptyStateProps) {
  return <CompactEmptyState title={title} description={description} />;
}
