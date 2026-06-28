"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Select } from "@/components/ui/select";
import { SkeletonText } from "@/components/ui/skeleton";
import {
  ENTIRE_REPORT_SECTIONS,
  FORM_PERSISTED_SECTIONS,
} from "@/lib/ai/copilot/sections";
import {
  REPORT_AI_ACTION_LABELS,
  REPORT_AI_SECTION_LABELS,
  REPORT_AI_STYLE_LABELS,
  type ReportAIActionKey,
  type ReportAIStyleMode,
} from "@/lib/ai/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import { useReportAI } from "@/components/reports/ai/report-ai-provider";
import { ReportAIUpgradeCard, ReportAIUsageCard } from "@/components/reports/ai/report-ai-usage-card";
import { ReportAIDiffPreview } from "@/components/reports/ai/report-ai-diff-preview";
import { ReportAIContextPanel } from "@/components/reports/ai/report-ai-context-panel";
import { ReportAIChecklist } from "@/components/reports/ai/report-ai-checklist";
import { ReportAISuggestions } from "@/components/reports/ai/report-ai-suggestions";
import { ReportAIConfidence } from "@/components/reports/ai/report-ai-confidence";
import { ReportAIWarnings } from "@/components/reports/ai/report-ai-warnings";
import { ReportAIHistory } from "@/components/reports/ai/report-ai-history";
import { ReportAIEntireReportProgress } from "@/components/reports/ai/report-ai-entire-report-progress";

const GENERATE_ACTIONS: ReportAIActionKey[] = [
  "generate_executive_summary",
  "generate_business_summary",
  "generate_key_wins",
  "generate_key_risks",
  "generate_next_actions",
  "generate_recommendations",
];

const REWRITE_ACTIONS: ReportAIActionKey[] = [
  "rewrite_professionally",
  "rewrite_shorter",
  "rewrite_longer",
  "explain_technically",
  "explain_for_executives",
];

const OUTPUT_ACTIONS: ReportAIActionKey[] = [
  "generate_customer_email",
  "generate_meeting_agenda",
];

type ReportAssistantPanelProps = {
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

export function ReportAssistantPanel({
  upgradeMessage,
  requiredPlanLabel,
}: ReportAssistantPanelProps) {
  const {
    aiEnabled,
    panelOpen,
    closePanel,
    selectedSection,
    setSelectedSection,
    styleMode,
    setStyleMode,
    loading,
    streaming,
    lastResponse,
    history,
    runAction,
    runEntireReport,
    retryLastAction,
    lastError,
    lastErrorRetryable,
    devNotice,
    usageSummary,
    confidence,
    warnings,
    suggestions,
    contextSnapshot,
    checklist,
    pendingDiff,
    undoEntry,
    entireReportDraft,
    entireReportProgress,
    acceptDiff,
    rejectDiff,
    undoLastApply,
    applyEntireReportSection,
    applyEntireReportAll,
    discardEntireReport,
    previewEntireReportSection,
    reapplyHistoryEntry,
    copyHistoryEntry,
    deleteHistoryEntry,
    averageLatencyMs,
  } = useReportAI();

  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!panelOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closePanel, panelOpen]);

  useEffect(() => {
    if (panelOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [panelOpen]);

  const sectionOptions = FORM_PERSISTED_SECTIONS.map((value) => ({
    value,
    label: REPORT_AI_SECTION_LABELS[value],
  }));

  const extendedSectionOptions = [
    ...sectionOptions,
    { value: "recommendations", label: REPORT_AI_SECTION_LABELS.recommendations },
    { value: "business_summary", label: REPORT_AI_SECTION_LABELS.business_summary },
  ];

  const styleOptions = Object.entries(REPORT_AI_STYLE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <>
      {panelOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          aria-label="Close AI assistant"
          onClick={closePanel}
        />
      ) : null}

      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal={panelOpen}
        aria-label="AI report copilot"
        aria-hidden={!panelOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl",
          transitionInteractive,
          panelOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-base font-semibold text-foreground">Executive Report Copilot</p>
            <p className="mt-1 text-sm text-muted">
              Generate MSP reports from verified operational context.
            </p>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className={cn(
              "rounded-md p-2 text-muted hover:bg-muted/10 hover:text-foreground",
              focusRing,
            )}
            aria-label="Close AI assistant panel"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {!aiEnabled ? (
            <ReportAIUpgradeCard message={upgradeMessage} requiredPlanLabel={requiredPlanLabel} title="Executive Report Copilot" />
          ) : (
            <>
              <ReportAIUsageCard usageSummary={usageSummary} averageLatencyMs={averageLatencyMs} />

              <ReportAIContextPanel snapshot={contextSnapshot} />
              <ReportAIWarnings warnings={warnings} />
              <ReportAIChecklist items={checklist} />
              <ReportAISuggestions suggestions={suggestions} />

              {devNotice ? <FormAlert variant="warning">{devNotice}</FormAlert> : null}

              {lastError ? (
                <div className="space-y-2" role="alert">
                  <FormAlert variant="error">{lastError}</FormAlert>
                  {lastErrorRetryable ? (
                    <Button type="button" variant="outline" size="sm" onClick={retryLastAction}>
                      Retry
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <Select
                id="ai-style-mode"
                label="Tone"
                value={styleMode}
                onChange={(event) => setStyleMode(event.target.value as ReportAIStyleMode)}
                options={styleOptions}
                description="Adjust writing style for generated content."
              />

              <Select
                id="ai-target-section"
                label="Target section"
                value={selectedSection ?? "executive_summary"}
                onChange={(event) =>
                  setSelectedSection(event.target.value as keyof typeof REPORT_AI_SECTION_LABELS)
                }
                options={extendedSectionOptions}
                description="Rewrite actions apply to the selected section."
              />

              <section aria-label="Generate entire report">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={loading}
                  loading={loading && entireReportProgress.active}
                  onClick={runEntireReport}
                  className="w-full"
                >
                  ✨ Generate entire report
                </Button>
              </section>

              <ReportAIEntireReportProgress progress={entireReportProgress} />

              {entireReportDraft ? (
                <section aria-label="Entire report preview" className="space-y-3 rounded-lg border border-border p-4">
                  <h3 className="text-sm font-medium text-foreground">Entire report preview</h3>
                  <ul className="space-y-2">
                    {ENTIRE_REPORT_SECTIONS.map((section) => {
                      const content = entireReportDraft[section];
                      if (!content) return null;
                      return (
                        <li key={section} className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-medium text-foreground">
                            {REPORT_AI_SECTION_LABELS[section]}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => previewEntireReportSection(section)}
                          >
                            Preview
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => applyEntireReportSection(section)}
                          >
                            Apply
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="primary" size="sm" onClick={applyEntireReportAll}>
                      Apply all
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={discardEntireReport}>
                      Discard
                    </Button>
                  </div>
                </section>
              ) : null}

              <ActionGroup title="Generate sections" actions={GENERATE_ACTIONS} loading={loading} onRun={runAction} />
              <ActionGroup title="Rewrite & explain" actions={REWRITE_ACTIONS} loading={loading} onRun={runAction} />
              <ActionGroup title="Outputs" actions={OUTPUT_ACTIONS} loading={loading} onRun={runAction} />

              {pendingDiff ? (
                <ReportAIDiffPreview
                  diff={pendingDiff}
                  onAccept={acceptDiff}
                  onReject={rejectDiff}
                  disabled={loading}
                />
              ) : (
                <section aria-label="AI generation result" className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium text-foreground">Generated draft</h3>
                    {streaming && loading ? (
                      <span className="text-xs text-muted" aria-live="polite">
                        Generating…
                      </span>
                    ) : null}
                  </div>

                  {loading && !lastResponse ? (
                    <SkeletonText lines={6} className="rounded-lg border border-border p-4" />
                  ) : (
                    <div
                      className={cn(
                        "min-h-[8rem] rounded-lg border border-border bg-muted/5 p-4",
                        streaming && "border-primary/20",
                      )}
                    >
                      {lastResponse ? (
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                          {lastResponse}
                        </pre>
                      ) : (
                        <p className="text-sm text-muted">No AI generation yet.</p>
                      )}
                    </div>
                  )}
                </section>
              )}

              {undoEntry && Date.now() <= undoEntry.expiresAt ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/5 p-3">
                  <p className="text-xs text-muted">
                    Applied to {REPORT_AI_SECTION_LABELS[undoEntry.section]}
                  </p>
                  <Button type="button" variant="outline" size="sm" onClick={undoLastApply}>
                    Undo
                  </Button>
                </div>
              ) : null}

              <ReportAIConfidence confidence={confidence} />

              <ReportAIHistory
                history={history}
                onReapply={reapplyHistoryEntry}
                onCopy={copyHistoryEntry}
                onDelete={deleteHistoryEntry}
              />
            </>
          )}
        </div>
      </aside>
    </>
  );
}

type ActionGroupProps = {
  title: string;
  actions: ReportAIActionKey[];
  loading: boolean;
  onRun: (action: ReportAIActionKey) => void;
};

function ActionGroup({ title, actions, loading, onRun }: ActionGroupProps) {
  return (
    <section aria-label={title}>
      <h3 className="mb-2 text-sm font-medium text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            loading={loading}
            onClick={() => onRun(action)}
          >
            {REPORT_AI_ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
    </section>
  );
}
