"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useAutomationStore } from "@/components/automation/automation-store-provider";
import { WorkflowGraph } from "@/components/automation/workflow-graph";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  simulateWorkflowServerAction,
  translateWorkflowServerAction,
  validateWorkflowServerAction,
} from "@/lib/ai/automation-builder/action";
import {
  WORKFLOW_ACTION_LABELS,
  WORKFLOW_TRIGGER_LABELS,
  type WorkflowActionType,
  type WorkflowDefinition,
  type WorkflowTriggerType,
} from "@/lib/automation/builder/types";
import { cn } from "@/lib/utils/cn";
import { auroraSurface } from "@/lib/ui/aurora";

type BuilderMode = "visual" | "ai";
type VisualStep = "trigger" | "conditions" | "actions" | "review";

const triggerOptions = Object.entries(WORKFLOW_TRIGGER_LABELS).map(([value, label]) => ({
  value,
  label: String(label),
}));

const actionOptions = Object.entries(WORKFLOW_ACTION_LABELS).map(([value, label]) => ({
  value,
  label: String(label),
}));

function createDraftWorkflow(initial?: Partial<WorkflowDefinition>): WorkflowDefinition {
  const now = new Date().toISOString();
  return {
    id: initial?.id ?? crypto.randomUUID(),
    name: initial?.name ?? "New automation",
    description: initial?.description ?? "",
    status: initial?.status ?? "draft",
    trigger: initial?.trigger ?? { type: "manual_trigger" },
    conditions: initial?.conditions,
    actions: initial?.actions ?? [
      { id: crypto.randomUUID(), type: "create_activity", label: "Create activity" },
    ],
    confirmationRequired: initial?.confirmationRequired ?? false,
    version: initial?.version ?? 1,
    createdAt: initial?.createdAt ?? now,
    updatedAt: now,
    lastExecutedAt: null,
  };
}

type AutomationBuilderWorkspaceProps = {
  initialWorkflow?: WorkflowDefinition;
};

export function AutomationBuilderWorkspace({ initialWorkflow }: AutomationBuilderWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveWorkflow, recordSimulation, getVersions, restoreVersion } = useAutomationStore();
  const [mode, setMode] = useState<BuilderMode>("ai");
  const [step, setStep] = useState<VisualStep>("trigger");
  const [workflow, setWorkflow] = useState<WorkflowDefinition>(() =>
    createDraftWorkflow(initialWorkflow),
  );
  const [naturalLanguage, setNaturalLanguage] = useState(
    searchParams.get("suggestion") ?? "",
  );
  const [validationIssues, setValidationIssues] = useState<
    Array<{ id: string; severity: string; message: string }>
  >([]);
  const [simulationSummary, setSimulationSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setError(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const versions = useMemo(() => getVersions(workflow.id), [getVersions, workflow.id]);

  const runValidation = useCallback(async (draft: WorkflowDefinition) => {
    const result = await validateWorkflowServerAction({ workflow: draft });
    if (result.ok) {
      setValidationIssues(result.validation.issues);
      return result.validation.valid;
    }
    setValidationIssues([{ id: "server", severity: "error", message: result.error }]);
    return false;
  }, []);

  const handleTranslate = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await translateWorkflowServerAction({ naturalLanguage });
      if (!result.ok) {
        setError(result.error);
        setRetryable(result.retryable ?? false);
        return;
      }
      setWorkflow({ ...result.workflow, id: workflow.id, version: workflow.version });
      setValidationIssues(result.validation.issues);
      setMode("visual");
      setStep("review");
    });
  }, [naturalLanguage, workflow.id, workflow.version]);

  const handleSimulate = useCallback(() => {
    setError(null);
    setSimulationSummary(null);
    startTransition(async () => {
      const result = await simulateWorkflowServerAction({ workflow });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValidationIssues(result.validation.issues);
      await recordSimulation(workflow, "simulation");
      setSimulationSummary(
        [
          `Trigger: ${result.simulation.triggerLabel}`,
          `Conditions matched: ${result.simulation.conditionsMatched ? "yes" : "no"}`,
          `Executed: ${result.simulation.actions.length}`,
          `Skipped: ${result.simulation.skippedActions.length}`,
          `Duration: ${result.simulation.durationMs}ms`,
        ].join(" · "),
      );
    });
  }, [recordSimulation, workflow]);

  const handleSave = useCallback(
    async (activate: boolean) => {
      setError(null);
      const draft: WorkflowDefinition = {
        ...workflow,
        status: activate ? "active" : "draft",
        version: workflow.version + 1,
        updatedAt: new Date().toISOString(),
      };
      const valid = await runValidation(draft);
      if (!valid) {
        setError("Fix validation errors before saving.");
        return;
      }
      const result = await saveWorkflow(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWorkflow(draft);
      router.push(`/automation/${draft.id}`);
    },
    [router, runValidation, saveWorkflow, workflow],
  );

  const updateTrigger = (type: WorkflowTriggerType) => {
    setWorkflow((prev) => ({ ...prev, trigger: { type } }));
  };

  const updateActionType = (index: number, type: WorkflowActionType) => {
    setWorkflow((prev) => ({
      ...prev,
      actions: prev.actions.map((action, actionIndex) =>
        actionIndex === index
          ? { ...action, type, label: WORKFLOW_ACTION_LABELS[type] }
          : action,
      ),
    }));
  };

  const addAction = () => {
    setWorkflow((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        { id: crypto.randomUUID(), type: "send_notification", label: "Send notification" },
      ],
    }));
  };

  const visualSteps: VisualStep[] = ["trigger", "conditions", "actions", "review"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Builder mode">
        <Button
          type="button"
          variant={mode === "ai" ? "primary" : "outline"}
          size="sm"
          onClick={() => setMode("ai")}
          aria-pressed={mode === "ai"}
        >
          AI Builder
        </Button>
        <Button
          type="button"
          variant={mode === "visual" ? "primary" : "outline"}
          size="sm"
          onClick={() => setMode("visual")}
          aria-pressed={mode === "visual"}
        >
          Visual Builder
        </Button>
      </div>

      {error ? (
        <div className="space-y-2" role="alert">
          <FormAlert variant="error">{error}</FormAlert>
          {retryable ? (
            <Button type="button" variant="outline" size="sm" onClick={handleTranslate}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {mode === "ai" ? (
        <section aria-label="AI builder" className={cn(auroraSurface, "space-y-4 p-5")}>
          <Textarea
            id="automation-natural-language"
            name="naturalLanguage"
            label="Describe your automation"
            rows={5}
            value={naturalLanguage}
            onChange={(event) => setNaturalLanguage(event.target.value)}
            placeholder='Example: "If a critical incident is created, notify the owner and prepare a customer update."'
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" loading={isPending} onClick={handleTranslate}>
              Translate to workflow
            </Button>
            <Button type="button" variant="outline" onClick={() => setMode("visual")}>
              Edit visually
            </Button>
          </div>
        </section>
      ) : (
        <>
          <nav aria-label="Visual builder steps" className="flex flex-wrap gap-2">
            {visualSteps.map((visualStep) => (
              <Button
                key={visualStep}
                type="button"
                size="sm"
                variant={step === visualStep ? "primary" : "outline"}
                onClick={() => setStep(visualStep)}
              >
                {visualStep.charAt(0).toUpperCase() + visualStep.slice(1)}
              </Button>
            ))}
          </nav>

          <section className={cn(auroraSurface, "space-y-4 p-5")}>
            {step === "trigger" ? (
              <>
                <Input
                  name="name"
                  label="Automation name"
                  value={workflow.name}
                  onChange={(event) =>
                    setWorkflow((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Select
                  id="workflow-trigger"
                  label="Trigger"
                  value={workflow.trigger.type}
                  onChange={(event) => updateTrigger(event.target.value as WorkflowTriggerType)}
                  options={triggerOptions}
                />
              </>
            ) : null}

            {step === "conditions" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  Add optional conditions in AI Builder or accept the default pass-through.
                </p>
                {workflow.conditions ? (
                  <FormAlert variant="warning">
                    {workflow.conditions.logic.toUpperCase()} group with{" "}
                    {workflow.conditions.conditions.length} condition
                    {workflow.conditions.conditions.length === 1 ? "" : "s"} configured.
                  </FormAlert>
                ) : (
                  <FormAlert variant="warning">No conditions — workflow runs on every trigger.</FormAlert>
                )}
              </div>
            ) : null}

            {step === "actions" ? (
              <div className="space-y-4">
                {workflow.actions.map((action, index) => (
                  <Select
                    key={action.id}
                    id={`action-${action.id}`}
                    label={`Action ${index + 1}`}
                    value={action.type}
                    onChange={(event) =>
                      updateActionType(index, event.target.value as WorkflowActionType)
                    }
                    options={actionOptions}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  Add action
                </Button>
              </div>
            ) : null}

            {step === "review" ? (
              <div className="space-y-4">
                <Textarea
                  id="workflow-description"
                  name="description"
                  label="Description"
                  rows={3}
                  value={workflow.description ?? ""}
                  onChange={(event) =>
                    setWorkflow((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={workflow.confirmationRequired}
                    onChange={(event) =>
                      setWorkflow((prev) => ({
                        ...prev,
                        confirmationRequired: event.target.checked,
                      }))
                    }
                  />
                  Require confirmation before destructive actions
                </label>
                <WorkflowGraph workflow={workflow} />
              </div>
            ) : null}
          </section>
        </>
      )}

      {validationIssues.length > 0 ? (
        <section aria-label="Validation results" className="space-y-2">
          {validationIssues.map((issue) => (
            <FormAlert
              key={issue.id}
              variant={issue.severity === "error" ? "error" : "warning"}
            >
              {issue.message}
            </FormAlert>
          ))}
        </section>
      ) : null}

      {simulationSummary ? (
        <FormAlert variant="warning">{simulationSummary} (simulation only — no real execution)</FormAlert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" loading={isPending} onClick={handleSimulate}>
          Run simulation
        </Button>
        <Button type="button" variant="outline" onClick={() => void handleSave(false)}>
          Save draft
        </Button>
        <Button type="button" loading={isPending} onClick={() => void handleSave(true)}>
          Activate
        </Button>
        <Link href="/automation" className="inline-flex items-center text-sm text-muted hover:text-foreground">
          Cancel
        </Link>
      </div>

      {versions.length > 0 ? (
        <section aria-label="Version history" className={cn(auroraSurface, "p-4")}>
          <h3 className="text-sm font-medium text-foreground">Versions (session)</h3>
          <ul className="mt-3 space-y-2">
            {versions.map((version) => (
              <li key={`${version.version}-${version.savedAt}`} className="flex items-center justify-between gap-3 text-xs">
                <span>
                  {version.label} · {new Date(version.savedAt).toLocaleString()}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    startTransition(async () => {
                      const restored = await restoreVersion(workflow.id, version.version);
                      if (restored) setWorkflow(restored);
                    });
                  }}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
