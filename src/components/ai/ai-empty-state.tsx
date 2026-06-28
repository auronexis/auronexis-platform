"use client";

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
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/5 p-4 text-center",
        className,
      )}
      role="status"
    >
      <p className="text-sm font-medium text-foreground">{title ?? defaults.title}</p>
      <p className="mt-2 text-sm text-muted">{description ?? defaults.description}</p>
    </div>
  );
}
