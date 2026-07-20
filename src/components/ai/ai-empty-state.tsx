import { CompactEmptyState } from "@/components/ui/compact-empty-state";
import { cn } from "@/lib/utils/cn";

export type AIEmptyStateKind =
  | "no_data"
  | "no_context"
  | "upgrade_required"
  | "provider_unavailable"
  | "nothing_generated";

const MESSAGES: Record<AIEmptyStateKind, { title: string; description: string }> = {
  no_data: {
    title: "No data available",
    description: "There is not enough verified data to run this analysis yet.",
  },
  no_context: {
    title: "Missing context",
    description: "Add more operational details before using AI on this record.",
  },
  upgrade_required: {
    title: "Upgrade required",
    description: "This AI feature is available on a higher plan.",
  },
  provider_unavailable: {
    title: "Provider unavailable",
    description: "The AI provider is temporarily unavailable. Please try again shortly.",
  },
  nothing_generated: {
    title: "Nothing generated yet",
    description: "Run an AI action to see results here.",
  },
};

type AIEmptyStateProps = {
  kind: AIEmptyStateKind;
  title?: string;
  description?: string;
  className?: string;
};

export function AIEmptyState({ kind, title, description, className }: AIEmptyStateProps) {
  const defaults = MESSAGES[kind];
  return (
    <CompactEmptyState
      title={title ?? defaults.title}
      description={description ?? defaults.description}
      className={cn("rounded-lg border-border bg-muted/5 py-4", className)}
    />
  );
}
