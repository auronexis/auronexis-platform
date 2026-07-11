import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/ui/empty-state";

type ReportEmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ReportEmptyState({
  title,
  description,
  action,
  secondaryHref,
  secondaryLabel,
}: ReportEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
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
