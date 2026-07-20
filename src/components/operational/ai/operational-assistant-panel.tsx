"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Select } from "@/components/ui/select";
import { SkeletonText } from "@/components/ui/skeleton";
import {
  INCIDENT_AI_ACTION_LABELS,
  OPERATIONAL_FIELD_LABELS,
  RISK_AI_ACTION_LABELS,
  type IncidentAIActionKey,
  type OperationalFieldKey,
  type RiskAIActionKey,
} from "@/lib/ai/operational/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";
import { restoreFocus, trapFocus } from "@/lib/a11y/focus";
import { OperationalAIDiffPreview } from "@/components/operational/ai/operational-ai-diff-preview";
import { OperationalAIHistory } from "@/components/operational/ai/operational-ai-history";
import { useOperationalAI } from "@/components/operational/ai/operational-ai-provider";
import {
  AIUpgradeCard,
  AIUsageCard,
} from "@/components/ai/ai-usage-card";

const RISK_SUMMARY_ACTIONS: RiskAIActionKey[] = [
  "summarize_risk",
  "assess_business_impact",
  "assess_technical_impact",
  "estimate_priority",
];

const RISK_MITIGATION_ACTIONS: RiskAIActionKey[] = [
  "generate_mitigation_plan",
  "generate_recommended_actions",
];

const RISK_REWRITE_ACTIONS: RiskAIActionKey[] = [
  "improve_description",
  "rewrite_professionally",
  "executive_explanation",
  "technical_explanation",
  "customer_friendly_explanation",
];

const INCIDENT_SUMMARY_ACTIONS: IncidentAIActionKey[] = [
  "summarize_incident",
  "generate_timeline_summary",
  "suggest_escalation",
  "suggest_sla_impact",
  "recommend_next_actions",
];

const INCIDENT_INVESTIGATION_ACTIONS: IncidentAIActionKey[] = [
  "generate_root_cause_analysis",
  "generate_investigation_notes",
  "generate_resolution_notes",
];

const INCIDENT_COMMUNICATION_ACTIONS: IncidentAIActionKey[] = [
  "generate_customer_update",
  "generate_internal_update",
];

type OperationalAssistantPanelProps = {
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

function ActionGroup({
  title,
  actions,
  labels,
  loading,
  onRun,
}: {
  title: string;
  actions: string[];
  labels: Record<string, string>;
  loading: boolean;
  onRun: (action: string) => void;
}) {
  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => onRun(action)}
          >
            {labels[action] ?? action}
          </Button>
        ))}
      </div>
    </section>
  );
}

export function OperationalAssistantPanel({
  upgradeMessage,
  requiredPlanLabel,
}: OperationalAssistantPanelProps) {
  const {
    entityType,
    aiEnabled,
    panelOpen,
    closePanel,
    selectedField,
    setSelectedField,
    loading,
    lastResponse,
    lastError,
    lastErrorRetryable,
    devNotice,
    usageSummary,
    confidence,
    warnings,
    checklist,
    relatedItems,
    contextSnapshot,
    riskAssessment,
    pendingDiff,
    undoEntry,
    history,
    averageLatencyMs,
    runAction,
    retryLastAction,
    acceptDiff,
    rejectDiff,
    undoLastApply,
    reapplyHistoryEntry,
    copyHistoryEntry,
    deleteHistoryEntry,
  } = useOperationalAI();

  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<Element | null>(null);
  const title = entityType === "risk" ? "Risk Copilot" : "Incident Copilot";

  useEffect(() => {
    if (!panelOpen) return;

    previouslyFocused.current = document.activeElement;
    const panel = panelRef.current;
    const releaseTrap = panel ? trapFocus(panel) : undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      releaseTrap?.();
      document.removeEventListener("keydown", handleKeyDown);
      restoreFocus(previouslyFocused.current);
    };
  }, [closePanel, panelOpen]);

  useEffect(() => {
    if (panelOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [panelOpen]);

  const fieldOptions = Object.entries(OPERATIONAL_FIELD_LABELS).map(([value, label]) => ({
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
        aria-label={`AI ${entityType} copilot`}
        aria-hidden={!panelOpen}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl",
          transitionInteractive,
          panelOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-base font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted">
              Investigate, prioritize, and document from verified workspace data.
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
            <AIUpgradeCard
              message={upgradeMessage}
              requiredPlanLabel={requiredPlanLabel}
              title={entityType === "risk" ? "AI Risk Copilot" : "AI Incident Copilot"}
            />
          ) : (
            <>
              <AIUsageCard usageSummary={usageSummary} averageLatencyMs={averageLatencyMs} />

              {contextSnapshot ? (
                <section aria-label="AI context" className="rounded-lg border border-border bg-muted/5 p-4">
                  <p className="text-sm font-medium text-foreground">Using</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <dt className="text-muted">Client</dt>
                      <dd className="font-medium text-foreground">{contextSnapshot.clientName}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Entity</dt>
                      <dd className="font-medium text-foreground">{contextSnapshot.entityTitle || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Severity</dt>
                      <dd className="font-medium text-foreground">{contextSnapshot.severity}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Status</dt>
                      <dd className="font-medium text-foreground">{contextSnapshot.status}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Open risks</dt>
                      <dd className="font-medium text-foreground">{contextSnapshot.openRisksCount}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Open incidents</dt>
                      <dd className="font-medium text-foreground">{contextSnapshot.openIncidentsCount}</dd>
                    </div>
                  </dl>
                </section>
              ) : null}

              {warnings.length > 0 ? (
                <div className="space-y-2" role="status">
                  {warnings.map((warning) => (
                    <FormAlert key={warning.id} variant="warning">
                      {warning.message}
                    </FormAlert>
                  ))}
                </div>
              ) : null}

              {checklist.length > 0 ? (
                <section aria-label="Action checklist" className="rounded-lg border border-border bg-muted/5 p-4">
                  <p className="text-sm font-medium text-foreground">Checklist</p>
                  <ul className="mt-3 space-y-2">
                    {checklist.map((item) => (
                      <li key={item.id} className="flex items-center gap-2 text-xs">
                        <span aria-hidden="true">{item.complete ? "✓" : "○"}</span>
                        <span className={item.complete ? "text-foreground" : "text-muted"}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {relatedItems.length > 0 ? (
                <section aria-label="Related items" className="rounded-lg border border-border bg-muted/5 p-4">
                  <p className="text-sm font-medium text-foreground">Related</p>
                  <ul className="mt-3 space-y-2">
                    {relatedItems.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="text-xs font-medium text-primary hover:underline">
                          {item.title}
                        </Link>
                        <span className="ml-2 text-[10px] uppercase text-muted">{item.kind}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {confidence ? (
                <p className="text-xs text-muted">
                  Confidence: {confidence.score}% ({confidence.label})
                </p>
              ) : null}

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
                id="ai-target-field"
                label="Target field"
                value={selectedField ?? "description"}
                onChange={(event) =>
                  setSelectedField(event.target.value as OperationalFieldKey)
                }
                options={fieldOptions}
                description="Field-targeted actions apply to the selected field."
              />

              {entityType === "risk" ? (
                <>
                  <ActionGroup
                    title="Summarize & assess"
                    actions={RISK_SUMMARY_ACTIONS}
                    labels={RISK_AI_ACTION_LABELS}
                    loading={loading}
                    onRun={(action) => void runAction(action as RiskAIActionKey)}
                  />
                  <ActionGroup
                    title="Mitigation"
                    actions={RISK_MITIGATION_ACTIONS}
                    labels={RISK_AI_ACTION_LABELS}
                    loading={loading}
                    onRun={(action) => void runAction(action as RiskAIActionKey)}
                  />
                  <ActionGroup
                    title="Rewrite & explain"
                    actions={RISK_REWRITE_ACTIONS}
                    labels={RISK_AI_ACTION_LABELS}
                    loading={loading}
                    onRun={(action) => void runAction(action as RiskAIActionKey)}
                  />
                </>
              ) : (
                <>
                  <ActionGroup
                    title="Summarize & triage"
                    actions={INCIDENT_SUMMARY_ACTIONS}
                    labels={INCIDENT_AI_ACTION_LABELS}
                    loading={loading}
                    onRun={(action) => void runAction(action as IncidentAIActionKey)}
                  />
                  <ActionGroup
                    title="Investigation"
                    actions={INCIDENT_INVESTIGATION_ACTIONS}
                    labels={INCIDENT_AI_ACTION_LABELS}
                    loading={loading}
                    onRun={(action) => void runAction(action as IncidentAIActionKey)}
                  />
                  <ActionGroup
                    title="Communication"
                    actions={INCIDENT_COMMUNICATION_ACTIONS}
                    labels={INCIDENT_AI_ACTION_LABELS}
                    loading={loading}
                    onRun={(action) => void runAction(action as IncidentAIActionKey)}
                  />
                </>
              )}

              {loading ? (
                <div aria-live="polite" aria-busy="true">
                  <SkeletonText lines={4} />
                </div>
              ) : null}

              {pendingDiff ? (
                <OperationalAIDiffPreview
                  diff={pendingDiff}
                  onAccept={acceptDiff}
                  onReject={rejectDiff}
                  disabled={loading}
                />
              ) : null}

              {undoEntry && Date.now() <= undoEntry.expiresAt ? (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/5 px-3 py-2 text-xs">
                  <span>Applied to {OPERATIONAL_FIELD_LABELS[undoEntry.field]}</span>
                  <Button type="button" variant="outline" size="sm" onClick={undoLastApply}>
                    Undo
                  </Button>
                </div>
              ) : null}

              {lastResponse && !pendingDiff ? (
                <section aria-label="AI output" className="space-y-2 rounded-lg border border-border p-4">
                  <h3 className="text-sm font-medium text-foreground">Output</h3>
                  <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-sm text-foreground">
                    {lastResponse}
                  </pre>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void navigator.clipboard.writeText(lastResponse)}
                  >
                    Copy
                  </Button>
                </section>
              ) : null}

              {riskAssessment ? (
                <section aria-label="Risk assessment" className="rounded-lg border border-border bg-muted/5 p-4">
                  <p className="text-sm font-medium text-foreground">Advisory assessment</p>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div>
                      <dt className="text-muted">Likelihood</dt>
                      <dd className="font-medium text-foreground">{riskAssessment.likelihood}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Impact</dt>
                      <dd className="font-medium text-foreground">{riskAssessment.impact}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Priority</dt>
                      <dd className="font-medium text-foreground">{riskAssessment.priority}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Confidence</dt>
                      <dd className="font-medium text-foreground">{riskAssessment.confidence}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-muted">{riskAssessment.reasoning}</p>
                </section>
              ) : null}

              <OperationalAIHistory
                entityType={entityType}
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
