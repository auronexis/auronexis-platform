"use client";

import { Button } from "@/components/ui/button";
import { focusRing } from "@/lib/ui/tokens";
import { cn } from "@/lib/utils/cn";
import type { ReportAISectionKey } from "@/lib/ai/types";
import { REPORT_AI_SECTION_LABELS } from "@/lib/ai/types";
import { useReportAI } from "@/components/reports/ai/report-ai-provider";

type ReportAISectionButtonProps = {
  section: ReportAISectionKey;
  className?: string;
};

/** Opens the AI panel with the target section pre-selected. */
export function ReportAISectionButton({ section, className }: ReportAISectionButtonProps) {
  const { aiEnabled, openPanel } = useReportAI();

  if (!aiEnabled) {
    return null;
  }

  const label = REPORT_AI_SECTION_LABELS[section];

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn("shrink-0 text-xs", className)}
      onClick={() => openPanel(section)}
      aria-label={`Open AI assistant for ${label}`}
    >
      <span aria-hidden="true">✨</span>
      <span>AI</span>
    </Button>
  );
}

type ReportAIFieldLabelProps = {
  section: ReportAISectionKey;
  htmlFor: string;
  label: string;
};

export function ReportAIFieldLabel({ section, htmlFor, label }: ReportAIFieldLabelProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <ReportAISectionButton section={section} />
    </div>
  );
}

type ReportAIFloatingTriggerProps = {
  className?: string;
};

export function ReportAIFloatingTrigger({ className }: ReportAIFloatingTriggerProps) {
  const { openPanel, panelOpen } = useReportAI();

  if (panelOpen) {
    return null;
  }

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
      aria-label="Open AI report assistant"
    >
      <span aria-hidden="true">✨</span>
      AI Assistant
    </button>
  );
}
