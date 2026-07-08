import Link from "next/link";
import { Activity } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

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
          <Link href={secondaryHref}>
            <Button size="sm" variant="outline">
              {secondaryLabel}
            </Button>
          </Link>
        ) : undefined
      }
    />
  );
}
