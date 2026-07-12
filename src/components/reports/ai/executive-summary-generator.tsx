"use client";

import { useCallback, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { useOptionalReportAI } from "@/components/reports/ai/report-ai-provider";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { generateExecutiveSummaryAction } from "@/lib/ai/executive-summary/action";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils/cn";

type ExecutiveSummaryGeneratorProps = {
  aiEnabled: boolean;
  reportId?: string;
  clientId: string;
  reportTitle: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  existingSummary: string;
  className?: string;
};

type GeneratorState = "idle" | "generating" | "preview" | "error" | "cooldown";

export function ExecutiveSummaryGenerator({
  aiEnabled,
  reportId,
  clientId,
  reportTitle,
  reportingPeriodStart,
  reportingPeriodEnd,
  existingSummary,
  className,
}: ExecutiveSummaryGeneratorProps) {
  const reportAI = useOptionalReportAI();
  const [state, setState] = useState<GeneratorState>("idle");
  const [previewDraft, setPreviewDraft] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelLabel, setModelLabel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canGenerate =
    aiEnabled &&
    Boolean(reportId) &&
    Boolean(reportTitle.trim()) &&
    Boolean(reportingPeriodStart) &&
    Boolean(reportingPeriodEnd);

  const handleGenerate = useCallback(() => {
    if (!canGenerate || !reportId) return;

    setErrorMessage(null);
    setState("generating");
    trackAnalyticsEvent("ai_summary_generation_started", { feature: "executive_report_summary" });

    startTransition(async () => {
      const result = await generateExecutiveSummaryAction({
        reportId,
        clientId,
        reportTitle,
        reportingPeriodStart,
        reportingPeriodEnd,
        fieldValues: reportAI
          ? {
              executive_summary: reportAI.fieldValues.executive_summary,
              key_wins: reportAI.fieldValues.key_wins,
              key_risks: reportAI.fieldValues.key_risks,
              next_actions: reportAI.fieldValues.next_actions,
            }
          : { executive_summary: existingSummary },
      });

      if (!result.ok) {
        trackAnalyticsEvent("ai_summary_generation_failed", {
          feature: "executive_report_summary",
          code: result.code,
        });
        setErrorMessage(result.error);
        setState(result.code === "rate_limit" || result.code === "duplicate" ? "cooldown" : "error");
        return;
      }

      trackAnalyticsEvent("ai_summary_generated", {
        feature: "executive_report_summary",
        surface: "report_ai",
        has_existing: result.hasExistingSummary,
      });
      setPreviewDraft(result.formattedDraft);
      setModelLabel(result.model);
      setState("preview");
    });
  }, [
    canGenerate,
    reportId,
    clientId,
    reportTitle,
    reportingPeriodStart,
    reportingPeriodEnd,
    reportAI,
    existingSummary,
  ]);

  const handleApply = useCallback(() => {
    if (!previewDraft) return;
    if (reportAI) {
      reportAI.setFieldValue("executive_summary", previewDraft);
    }
    trackAnalyticsEvent("ai_summary_saved", { feature: "executive_report_summary", applied: true });
    setPreviewDraft(null);
    setState("idle");
  }, [previewDraft, reportAI]);

  const handleDismiss = useCallback(() => {
    setPreviewDraft(null);
    setState("idle");
  }, []);

  if (!aiEnabled) {
    return null;
  }

  return (
    <div className={cn("space-y-3 rounded-lg border border-border/60 bg-muted/5 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">AI-assisted executive summary</p>
          <p className="text-xs text-muted">
            Generates a reviewable draft. Nothing is saved or published automatically.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={!canGenerate || isPending || state === "generating"}
          loading={isPending || state === "generating"}
          loadingText="Generating…"
          aria-label="Generate executive summary with AI"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Generate executive summary
        </Button>
      </div>

      {!reportId ? (
        <p className="text-xs text-muted">Save the report as a draft first to enable AI generation.</p>
      ) : null}

      {state === "preview" && previewDraft ? (
        <div className="space-y-3">
          <FormAlert variant="warning">
            AI-generated draft — review before saving.{" "}
            {existingSummary.trim() ? "Your existing summary was not overwritten." : ""}
            {modelLabel ? ` Model: ${modelLabel}.` : ""}
          </FormAlert>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-surface p-3 text-sm text-foreground">
            {previewDraft}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleApply}>
              Apply to executive summary
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      {errorMessage ? <FormAlert variant="error">{errorMessage}</FormAlert> : null}

      {state === "cooldown" ? (
        <p className="text-xs text-muted">Please wait before generating again.</p>
      ) : null}
    </div>
  );
}
