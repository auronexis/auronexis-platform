"use client";

import { Button } from "@/components/ui/button";
import { formatHistoryMeta, type AIHistoryEntryBase } from "@/lib/ai/core/history";

export type AIHistoryEntryView = AIHistoryEntryBase & {
  onReapply?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
};

type AIHistoryProps = {
  entries: AIHistoryEntryBase[];
  onReapply: (entry: AIHistoryEntryBase) => void;
  onCopy: (entry: AIHistoryEntryBase) => void;
  onDelete: (id: string) => void;
  onRetry?: (entry: AIHistoryEntryBase) => void;
  emptyMessage?: string;
};

/** Unified session history — Copy, Reapply, Delete, optional Retry. No raw prompts. */
export function AIHistory({
  entries,
  onReapply,
  onCopy,
  onDelete,
  onRetry,
  emptyMessage = "No AI generation yet.",
}: AIHistoryProps) {
  if (entries.length === 0) {
    return (
      <section aria-label="AI history" className="rounded-lg border border-border bg-muted/5 p-4">
        <p className="text-sm font-medium text-foreground">History</p>
        <p className="mt-2 text-xs text-muted">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section aria-label="AI history" className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">History (session only)</h3>
      <ul className="space-y-2" role="list">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-md border border-border bg-muted/5 px-3 py-2 text-xs"
          >
            <div>
              <span className="font-medium text-foreground">{entry.label ?? entry.action}</span>
              {entry.sublabel ? <span className="text-muted"> · {entry.sublabel}</span> : null}
              <span className="mt-1 block text-muted">{formatHistoryMeta(entry)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onReapply(entry)}>
                Reapply
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onCopy(entry)}>
                Copy
              </Button>
              {onRetry ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onRetry(entry)}>
                  Retry
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={() => onDelete(entry.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
