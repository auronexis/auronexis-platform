import type { ReactNode } from "react";
import { Activity } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/ui/empty-state";

type ConnectorEmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ConnectorEmptyState({
  title = "No monitoring connectors yet",
  description = "Add a connector to start collecting operational signals from your stack.",
  action,
  secondaryHref = "/incidents",
  secondaryLabel = "View incidents",
}: ConnectorEmptyStateProps) {
  return (
    <EmptyState
      icon={Activity}
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
