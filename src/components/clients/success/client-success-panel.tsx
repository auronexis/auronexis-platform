"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { refreshClientSuccessServerAction } from "@/lib/ai/client-success/action";
import type { ClientSuccessAnalysis, ClientSuccessHistoryEntry } from "@/lib/ai/client-success/types";
import {
  CHURN_RISK_LABELS,
  CLIENT_HEALTH_LABELS,
  COMMUNICATION_RATING_LABELS,
  INSUFFICIENT_CLIENT_DATA,
  MATURITY_LABELS,
  RELATIONSHIP_STATUS_LABELS,
} from "@/lib/ai/client-success/types";
import { cn } from "@/lib/utils/cn";

type ClientSuccessPanelProps = {
  initialAnalysis: ClientSuccessAnalysis;
};

function TrendArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up") return <ArrowUpRight className="h-4 w-4" aria-hidden="true" />;
  if (direction === "down") return <ArrowDownRight className="h-4 w-4" aria-hidden="true" />;
  return <Minus className="h-4 w-4" aria-hidden="true" />;
}

export function ClientSuccessPanel({ initialAnalysis }: ClientSuccessPanelProps) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [history, setHistory] = useState<ClientSuccessHistoryEntry[]>(() => [
    {
      id: crypto.randomUUID(),
      timestamp: initialAnalysis.generatedAt,
      provider: initialAnalysis.providerId,
      model: initialAnalysis.model,
      durationMs: initialAnalysis.durationMs,
      tokens: null,
      analysisSummary: initialAnalysis.overallSummary,
    },
  ]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        panelRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const refresh = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await refreshClientSuccessServerAction(analysis.clientId);
      if (!result.ok) {
        setError(result.error);
        setRetryable(result.retryable ?? false);
        return;
      }

      setAnalysis(result.data);
      setHistory((prev) =>
        [
          {
            id: crypto.randomUUID(),
            timestamp: result.data.generatedAt,
            provider: result.data.providerId,
            model: result.data.model,
            durationMs: result.data.durationMs,
            tokens: null,
            analysisSummary: result.data.overallSummary,
          },
          ...prev,
        ].slice(0, 10),
      );
    });
  }, [analysis.clientId]);

  const copySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(analysis.overallSummary);
    } catch {
      // ignore
    }
  }, [analysis.overallSummary]);

  const deleteHistoryEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  if (analysis.confidence.score < 30) {
    return (
      <div className="rounded-xl border border-border bg-muted/5 p-6">
        <p className="text-sm text-muted">{INSUFFICIENT_CLIENT_DATA}</p>
      </div>
    );
  }

  return (
    <div ref={panelRef} tabIndex={-1} aria-label="Client Success Intelligence" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Client Success Intelligence</p>
          <p className="mt-1 text-xs text-muted">
            Confidence {analysis.confidence.score}% ({analysis.confidence.label})
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" loading={isPending} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="space-y-2">
          <FormAlert variant="error">{error}</FormAlert>
          {retryable ? (
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {analysis.warnings.length > 0 ? (
        <div className="space-y-2" role="status">
          {analysis.warnings.map((warning) => (
            <FormAlert key={warning.id} variant="warning">
              {warning.message}
            </FormAlert>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Health score" value={`${analysis.healthScore}%`} sub={CLIENT_HEALTH_LABELS[analysis.healthLabel]} />
        <MetricCard label="Churn risk" value={CHURN_RISK_LABELS[analysis.churnRisk]} sub={analysis.churnFactors[0] ?? "No elevated signals"} />
        <MetricCard label="Communication" value={COMMUNICATION_RATING_LABELS[analysis.communicationRating]} sub={`${analysis.communicationScore}% score`} />
        <MetricCard label="Operational maturity" value={MATURITY_LABELS[analysis.operationalMaturity]} sub={analysis.maturityReasoning} />
        <MetricCard label="Reporting quality" value={analysis.reportingQuality.replace("_", " ")} sub={analysis.reportQualityIssues[0] ?? "No issues"} />
        <MetricCard label="Relationship" value={RELATIONSHIP_STATUS_LABELS[analysis.relationshipStatus]} sub={`Priority: ${analysis.priority}`} />
      </div>

      <section aria-label="Overall AI summary" className="rounded-xl border border-border bg-surface/80 p-4">
        <h3 className="text-sm font-medium text-foreground">Overall AI summary</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{analysis.overallSummary}</p>
      </section>

      <section aria-label="AI summaries" className="grid gap-4 lg:grid-cols-2">
        {(
          [
            ["Executive summary", analysis.summaries.executive],
            ["Technical summary", analysis.summaries.technical],
            ["Customer summary", analysis.summaries.customer],
            ["Internal summary", analysis.summaries.internal],
          ] as const
        ).map(([title, content]) => (
          <div key={title} className="rounded-xl border border-border bg-muted/5 p-4">
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted">{content}</p>
          </div>
        ))}
      </section>

      <section aria-label="Client timeline summary">
        <h3 className="text-sm font-medium text-foreground">Timeline summary</h3>
        <ol className="mt-3 space-y-2">
          {analysis.timeline.map((entry) => (
            <li key={entry.id} className="flex gap-3 text-sm">
              <span className="shrink-0 text-xs text-muted">
                {new Date(entry.date).toLocaleDateString()}
              </span>
              <span className="text-foreground">{entry.label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Success checklist">
        <h3 className="text-sm font-medium text-foreground">Success checklist</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {analysis.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-2 text-sm">
              <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-xs", item.complete ? "bg-success/15 text-success" : "bg-muted/15 text-muted")}>
                {item.complete ? "✓" : "○"}
              </span>
              <span className={item.complete ? "text-foreground" : "text-muted"}>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Trend analysis">
        <h3 className="text-sm font-medium text-foreground">Trend analysis</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {analysis.trends.map((trend) => (
            <div key={trend.id} className="rounded-lg border border-border bg-surface/80 p-3">
              <p className="text-xs text-muted">{trend.label}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-lg font-semibold text-foreground">
                  {trend.current}
                  {trend.unit ?? ""}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  <TrendArrow direction={trend.direction} />
                  {trend.changePercent != null ? `${trend.changePercent}%` : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Smart recommendations">
        <h3 className="text-sm font-medium text-foreground">Smart recommendations</h3>
        <ul className="mt-3 space-y-2">
          {analysis.recommendations.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-muted/5 p-3 text-sm">
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted">{item.description}</p>
              {item.href ? (
                <a href={item.href} className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                  {item.actionLabel} →
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="AI history">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground">History (session only)</h3>
          <Button type="button" variant="outline" size="sm" onClick={copySummary}>
            Copy summary
          </Button>
        </div>
        <ul className="mt-3 space-y-2">
          {history.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-border bg-muted/5 p-3 text-xs text-muted">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span>
                  {new Date(entry.timestamp).toLocaleString()} · {entry.provider} · {entry.durationMs}ms
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => deleteHistoryEntry(entry.id)}>
                  Delete
                </Button>
              </div>
              <p className="mt-2 text-foreground">{entry.analysisSummary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/80 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted line-clamp-2">{sub}</p>
    </div>
  );
}
