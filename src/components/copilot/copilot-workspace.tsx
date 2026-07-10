"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { CopilotAnswerPanel } from "@/components/copilot/copilot-answer-panel";
import { CopilotSuggestedPrompts } from "@/components/copilot/copilot-suggested-prompts";
import { AIEmptyState } from "@/components/ai/ai-empty-state";
import { AIErrorAlert } from "@/components/ai/ai-error-alert";
import { AIUsageCard, AIUpgradeCard } from "@/components/ai/ai-usage-card";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { SkeletonText } from "@/components/ui/skeleton";
import {
  askCopilotServerAction,
  type AskCopilotInput,
  type CopilotAnswer,
  type CopilotHistoryTurn,
  type CopilotTaskType,
  MAX_COPILOT_HISTORY_TURNS,
  MAX_COPILOT_PROMPT_LENGTH,
} from "@/lib/ai/copilot";
import type { CopilotSuggestedPrompt } from "@/lib/ai/copilot/suggested-prompts";
import type { AIUsageSummary } from "@/lib/ai/types";
import { cn } from "@/lib/utils/cn";
import { focusRing } from "@/lib/ui/tokens";

type CopilotWorkspaceProps = {
  allowed: boolean;
  upgradeMessage: string;
  requiredPlanLabel: string;
  providerConfigured: boolean;
  initialUsage: AIUsageSummary;
  suggestedPrompts: CopilotSuggestedPrompt[];
  initialTaskType?: CopilotTaskType;
  initialPrompt?: string;
  clientId?: string;
  title?: string;
  description?: string;
};

export function CopilotWorkspace({
  allowed,
  upgradeMessage,
  requiredPlanLabel,
  providerConfigured,
  initialUsage,
  suggestedPrompts,
  initialTaskType = "workspace_question",
  initialPrompt = "",
  clientId,
  title = "Ask Auroranexis",
  description = "Operational intelligence grounded in your organization's verified workspace data.",
}: CopilotWorkspaceProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [taskType, setTaskType] = useState<CopilotTaskType>(initialTaskType);
  const [answer, setAnswer] = useState<CopilotAnswer | null>(null);
  const [usage, setUsage] = useState(initialUsage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [history, setHistory] = useState<CopilotHistoryTurn[]>([]);
  const [devNotice, setDevNotice] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const creditsExhausted = useMemo(() => {
    if (usage.unlimitedCredits) return false;
    return usage.limit > 0 && usage.remainingCalls <= 0;
  }, [usage]);

  const runAsk = useCallback(
    async (input: AskCopilotInput) => {
      if (submittingRef.current || !allowed || creditsExhausted) return;
      submittingRef.current = true;
      setLoading(true);
      setError(null);
      setErrorCode(null);

      try {
        const result = await askCopilotServerAction(input);

        if (!result.ok) {
          setError(result.error);
          setErrorCode(result.code);
          return;
        }

        setAnswer(result.answer);
        setUsage(result.usageSummary);
        setDevNotice(result.devNotice);

        const userContent = input.prompt ?? "";
        setHistory((prev) => {
          const next: CopilotHistoryTurn[] = [
            ...prev,
            { role: "user", content: userContent },
            { role: "assistant", content: result.answer.summary },
          ];
          return next.slice(-MAX_COPILOT_HISTORY_TURNS * 2);
        });
      } finally {
        setLoading(false);
        submittingRef.current = false;
      }
    },
    [allowed, creditsExhausted],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed && taskType === "workspace_question") return;

    await runAsk({
      taskType,
      prompt: trimmed,
      clientId,
      history,
    });
  };

  const handleSuggested = async (item: CopilotSuggestedPrompt) => {
    setPrompt(item.prompt);
    setTaskType(item.taskType);
    await runAsk({
      taskType: item.taskType,
      prompt: item.prompt,
      clientId,
      history,
    });
  };

  const handleNewConversation = () => {
    setHistory([]);
    setAnswer(null);
    setError(null);
    setErrorCode(null);
    setPrompt("");
    setTaskType(clientId ? "client_summary" : "workspace_question");
  };

  const handleCopy = async () => {
    if (!answer) return;
    const text = [
      answer.summary,
      "",
      answer.answer,
      "",
      "Facts:",
      ...answer.facts.map((fact) => `- ${fact.statement} (${fact.sourceLabel})`),
      "",
      "Recommendations:",
      ...answer.recommendations.map((rec) => `- ${rec.title}: ${rec.reason}`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
  };

  if (!allowed) {
    return (
      <AIUpgradeCard
        title="Ask Auroranexis"
        message={upgradeMessage}
        requiredPlanLabel={requiredPlanLabel}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          {title}
        </div>
        <p className="text-sm text-muted">{description}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          {!providerConfigured ? (
            <AIEmptyState kind="provider_unavailable" title="AI is not configured" description="Contact your workspace administrator to enable AI provider settings." />
          ) : null}

          {devNotice ? <FormAlert variant="warning">{devNotice}</FormAlert> : null}

          {creditsExhausted ? (
            <FormAlert variant="warning">
              Monthly AI credits exhausted. Upgrade your plan or wait for the next billing period.
            </FormAlert>
          ) : null}

          <CopilotSuggestedPrompts
            prompts={suggestedPrompts}
            disabled={loading || creditsExhausted}
            disabledReason={creditsExhausted ? "No credits remaining this month." : undefined}
            onSelect={handleSuggested}
          />

          <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="copilot-prompt" className="text-sm font-medium text-foreground">
              Your question
            </label>
            <textarea
              id="copilot-prompt"
              name="prompt"
              rows={4}
              maxLength={MAX_COPILOT_PROMPT_LENGTH}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={loading || creditsExhausted}
              placeholder="Ask about clients, risks, incidents, reports, SLA, or executive priorities…"
              className={cn(
                "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground",
                focusRing,
              )}
              aria-describedby="copilot-prompt-hint"
            />
            <p id="copilot-prompt-hint" className="text-xs text-muted">
              Based on available workspace data. AI-generated answers require human verification.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading || creditsExhausted}>
                {loading ? "Generating…" : "Ask Auroranexis"}
              </Button>
              <Button type="button" variant="outline" onClick={handleNewConversation} disabled={loading}>
                New conversation
              </Button>
            </div>
          </form>

          {loading ? (
            <div aria-live="polite" aria-busy="true" className="space-y-2">
              <SkeletonText lines={4} />
              <p className="text-xs text-muted">Analyzing verified workspace context…</p>
            </div>
          ) : null}

          {error ? (
            <div aria-live="assertive">
              <AIErrorAlert
                message={error}
                retryable={errorCode === "GENERIC_AI_ERROR" || errorCode === "PROVIDER_TIMEOUT"}
                onRetry={() =>
                  runAsk({
                    taskType,
                    prompt: prompt.trim(),
                    clientId,
                    history,
                  })
                }
              />
            </div>
          ) : null}

          {answer && !loading ? <CopilotAnswerPanel answer={answer} onCopy={handleCopy} /> : null}

          {!answer && !loading && !error ? (
            <AIEmptyState
              kind="nothing_generated"
              title="No answer yet"
              description="Choose a suggested prompt or ask a question about your workspace."
            />
          ) : null}
        </div>

        <aside className="space-y-4">
          <AIUsageCard usageSummary={usage} />
        </aside>
      </div>
    </div>
  );
}
