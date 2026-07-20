import type { AIChecklistItem } from "@/lib/ai/types";
import { cn } from "@/lib/utils/cn";

type ReportAIChecklistProps = {
  items: AIChecklistItem[];
};

export function ReportAIChecklist({ items }: ReportAIChecklistProps) {
  return (
    <section aria-label="Report checklist" className="rounded-lg border border-border bg-surface/80 p-4">
      <p className="text-sm font-medium text-foreground">Report checklist</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                item.complete
                  ? "bg-success/15 text-success"
                  : "bg-muted/15 text-muted",
              )}
              aria-hidden="true"
            >
              {item.complete ? "✓" : "○"}
            </span>
            <span className={item.complete ? "text-foreground" : "text-muted"}>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
