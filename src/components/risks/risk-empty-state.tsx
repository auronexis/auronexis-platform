import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

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
