"use client";

import { Button } from "@/components/ui/button";
import { OPERATIONAL_FIELD_LABELS, type OperationalFieldKey } from "@/lib/ai/operational/types";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";
import { useOperationalAI } from "@/components/operational/ai/operational-ai-provider";

type OperationalAIFieldButtonProps = {
  field: OperationalFieldKey;
  className?: string;
};

export function OperationalAIFieldButton({ field, className }: OperationalAIFieldButtonProps) {
  const { aiEnabled, openPanel } = useOperationalAI();

  if (!aiEnabled) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("shrink-0 text-xs", className)}
      onClick={() => openPanel(field)}
      aria-label={`Open AI assistant for ${OPERATIONAL_FIELD_LABELS[field]}`}
    >
      <span aria-hidden="true">✨</span>
      <span>AI</span>
    </Button>
  );
}

type OperationalAIFieldLabelProps = {
  field: OperationalFieldKey;
  htmlFor: string;
  label: string;
};

export function OperationalAIFieldLabel({ field, htmlFor, label }: OperationalAIFieldLabelProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <OperationalAIFieldButton field={field} />
    </div>
  );
}

type OperationalAIFloatingTriggerProps = {
  className?: string;
};

export function OperationalAIFloatingTrigger({ className }: OperationalAIFloatingTriggerProps) {
  const { entityType, openPanel, panelOpen } = useOperationalAI();

  if (panelOpen) {
    return null;
  }

  const label = entityType === "risk" ? "Risk Copilot" : "Incident Copilot";

  return (
    <button
      type="button"
      onClick={() => openPanel()}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground shadow-lg backdrop-blur-sm",
        "hover:border-primary/30 hover:bg-primary/[0.04] hover:shadow-interactive",
        focusRing,
        className,
      )}
      aria-label={`Open AI ${entityType} assistant`}
    >
      <span aria-hidden="true">✨</span>
      {label}
    </button>
  );
}
