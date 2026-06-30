import { Activity } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

type ActivityEmptyStateProps = {
  title?: string;
  description?: string;
};

export function ActivityEmptyState({
  title = "No activity yet",
  description = "Operational changes across your workspace will appear here as your team works.",
}: ActivityEmptyStateProps) {
  return (
    <EmptyState icon={Activity} title={title} description={description} className="border-solid" />
  );
}
