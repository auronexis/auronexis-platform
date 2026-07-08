import Link from "next/link";
import type { ReactNode } from "react";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

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
