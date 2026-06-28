"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type AIDiffPreviewProps = {
  targetLabel: string;
  current: string;
  proposed: string;
  onAccept: () => void;
  onReject: () => void;
  disabled?: boolean;
  className?: string;
};

/** Shared diff preview — Accept / Reject with 30s undo handled by provider. */
export function AIDiffPreview({
  targetLabel,
  current,
  proposed,
  onAccept,
  onReject,
  disabled,
  className,
}: AIDiffPreviewProps) {
  return (
    <section
      aria-label={`Preview changes for ${targetLabel}`}
      className={cn(
        "space-y-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4",
        className,
      )}
    >
      <h3 className="text-sm font-medium text-foreground">Review: {targetLabel}</h3>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Current</p>
          <div className="max-h-32 overflow-y-auto rounded-md border border-border bg-surface p-3">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">
              {current.trim() || "(empty)"}
            </pre>
          </div>
        </div>

        <p className="text-center text-xs text-muted" aria-hidden="true">
          ↓
        </p>

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-primary">AI version</p>
          <div className="max-h-40 overflow-y-auto rounded-md border border-primary/30 bg-surface p-3">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{proposed}</pre>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" disabled={disabled} onClick={onAccept}>
          Accept
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onReject}>
          Reject
        </Button>
      </div>
    </section>
  );
}
