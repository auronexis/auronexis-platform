import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/ui/empty-state";

type RiskEmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function RiskEmptyState({
  title = "No risks match this filter",
  description = "Risks will appear here when detected automatically or added manually.",
  action,
  secondaryHref = "/clients",
  secondaryLabel = "View clients",
}: RiskEmptyStateProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={description}
      action={action}
      secondaryAction={
        secondaryHref && secondaryLabel ? (
          <LinkButton href={secondaryHref} size="sm" variant="outline">
            {secondaryLabel}
          </LinkButton>
        ) : undefined
      }
    />
  );
}
