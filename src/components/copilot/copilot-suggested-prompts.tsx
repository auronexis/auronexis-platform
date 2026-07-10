"use client";

import type { CopilotSuggestedPrompt } from "@/lib/ai/copilot/suggested-prompts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type CopilotSuggestedPromptsProps = {
  prompts: CopilotSuggestedPrompt[];
  disabled?: boolean;
  disabledReason?: string;
  onSelect: (prompt: CopilotSuggestedPrompt) => void;
  className?: string;
};

export function CopilotSuggestedPrompts({
  prompts,
  disabled,
  disabledReason,
  onSelect,
  className,
}: CopilotSuggestedPromptsProps) {
  return (
    <section aria-label="Suggested prompts" className={cn("space-y-3", className)}>
      <div>
        <h2 className="text-sm font-medium text-foreground">Suggested prompts</h2>
        {disabled && disabledReason ? (
          <p className="mt-1 text-xs text-muted">{disabledReason}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">Based on available workspace data.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            aria-label={`Suggested prompt: ${item.label}`}
            className={cn("h-auto whitespace-normal py-2 text-left", focusRing, transitionInteractive)}
            onClick={() => onSelect(item)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
