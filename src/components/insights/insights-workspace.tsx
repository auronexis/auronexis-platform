"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Select } from "@/components/ui/select";
import { refreshOperationalInsightsServerAction } from "@/lib/ai/insights/action";
import {
  CLIENT_PRIORITY_LABELS,
  CUSTOMER_HEALTH_LABELS,
  EMPTY_INSIGHTS_MESSAGE,
  INSIGHT_CATEGORY_LABELS,
  INSIGHT_PRIORITY_LABELS,
  INSUFFICIENT_DATA_MESSAGE,
  type InsightsFilterState,
  type InsightsHistoryEntry,
  type OperationalIntelligenceResult,
  type OperationalInsight,
  type TrendMetric,
} from "@/lib/ai/insights/types";
import { AIUsageCard } from "@/components/ai/ai-usage-card";
import type { AIUsageSummary } from "@/lib/ai/types";
import { cn } from "@/lib/utils/cn";

type InsightsWorkspaceProps = {
  initialData: OperationalIntelligenceResult;
  usageSummary: AIUsageSummary;
  clients: Array<{ id: string; name: string }>;
};

const priorityStyles: Record<OperationalInsight["priority"], string> = {
  critical: "border-l-danger bg-danger/5",
  high: "border-l-warning bg-warning/5",
  medium: "border-l-primary bg-primary/5",
  low: "border-l-border bg-muted/5",
};

function filterInsights(
  insights: OperationalInsight[],
  filters: InsightsFilterState,
): OperationalInsight[] {
  return insights.filter((insight) => {
    if (filters.clientId && insight.relatedClientId !== filters.clientId) return false;
    if (filters.severity !== "all" && insight.priority !== filters.severity) return false;
    if (filters.category !== "all" && insight.category !== filters.category) return false;
    if (filters.dateFrom && insight.timestamp < filters.dateFrom) return false;
    if (filters.dateTo && insight.timestamp > filters.dateTo) return false;
    return true;
  });
}

function TrendCard({ trend }: { trend: TrendMetric }) {
  const Icon =
    trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus;
  const tone =
    trend.id === "sla" || trend.id === "incidents" || trend.id === "risks"
      ? trend.direction === "up"
        ? "text-danger"
        : trend.direction === "down"
          ? "text-success"
          : "text-muted"
      : trend.direction === "up"
        ? "text-success"
        : trend.direction === "down"
          ? "text-danger"
          : "text-muted";

  return (
    <div className="rounded-xl border border-border bg-surface/80 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{trend.label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold text-foreground">
          {trend.current}
          {trend.unit ?? ""}
        </p>
        <div className={cn("flex items-center gap-1 text-sm font-medium", tone)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">
            {trend.direction === "up" ? "Up" : trend.direction === "down" ? "Down" : "Unchanged"}
          </span>
          {trend.changePercent != null ? `${trend.changePercent > 0 ? "+" : ""}${trend.changePercent}%` : "—"}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">Previous: {trend.previous}{trend.unit ?? ""}</p>
    </div>
  );
}

export function InsightsWorkspace({ initialData, usageSummary, clients }: InsightsWorkspaceProps) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<InsightsHistoryEntry[]>(() => [
    {
      id: crypto.randomUUID(),
      insightCount: initialData.insights.length,
      timestamp: initialData.generatedAt,
      provider: initialData.providerId,
      durationMs: initialData.durationMs,
      tokens: null,
    },
  ]);
  const [filters, setFilters] = useState<InsightsFilterState>({
    clientId: null,
    severity: "all",
    category: "all",
    dateFrom: null,
    dateTo: null,
  });

  const visibleInsights = useMemo(() => {
    return filterInsights(data.insights, filters).filter((insight) => !dismissedIds.has(insight.id));
  }, [data.insights, dismissedIds, filters]);

  const refresh = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await refreshOperationalInsightsServerAction();
      if (!result.ok) {
        setError(result.error);
        setRetryable(result.retryable ?? false);
        return;
      }

      setData(result.data);
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          insightCount: result.data.insights.length,
          timestamp: result.data.generatedAt,
          provider: result.data.providerId,
          durationMs: result.data.durationMs,
          tokens: null,
        },
        ...prev,
      ].slice(0, 10));
    });
  }, []);

  const copyInsight = useCallback(async (insight: OperationalInsight) => {
    const text = `${insight.title}\n\n${insight.description}\n\nRecommended: ${insight.recommendedAction}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-8">
      <AIUsageCard usageSummary={usageSummary} averageLatencyMs={data.durationMs} />

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

      <section aria-label="Filters" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          id="insights-filter-client"
          label="Client"
          value={filters.clientId ?? "all"}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              clientId: event.target.value === "all" ? null : event.target.value,
            }))
          }
          options={[
            { value: "all", label: "All clients" },
            ...clients.map((client) => ({ value: client.id, label: client.name })),
          ]}
        />
        <Select
          id="insights-filter-severity"
          label="Severity"
          value={filters.severity}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              severity: event.target.value as InsightsFilterState["severity"],
            }))
          }
          options={[
            { value: "all", label: "All severities" },
            ...Object.entries(INSIGHT_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <Select
          id="insights-filter-category"
          label="Category"
          value={filters.category}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              category: event.target.value as InsightsFilterState["category"],
            }))
          }
          options={[
            { value: "all", label: "All categories" },
            ...Object.entries(INSIGHT_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <div className="flex items-end">
          <Button type="button" variant="primary" size="sm" loading={isPending} onClick={refresh}>
            Refresh insights
          </Button>
        </div>
      </section>

      <section aria-label="Workspace health" className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.06] to-surface p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Workspace health</p>
            <p className="mt-2 text-4xl font-semibold text-foreground">{data.workspaceHealth.score}%</p>
            <p className="mt-1 text-sm text-muted">{data.workspaceHealth.label} operational posture</p>
          </div>
          <p className="text-xs text-muted">
            Generated {new Date(data.generatedAt).toLocaleString()} · {data.providerId}
          </p>
        </div>
      </section>

      <section aria-label="Trend analysis" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Trend analysis</h2>
        {!data.hasSufficientData ? (
          <p className="text-sm text-muted">{INSUFFICIENT_DATA_MESSAGE}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.trends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <section aria-label="Smart alerts" className="space-y-3 xl:col-span-7">
          <h2 className="text-lg font-semibold text-foreground">Operational insights</h2>
          {visibleInsights.length === 0 ? (
            <p className="rounded-xl border border-border bg-muted/5 px-4 py-6 text-sm text-muted">
              {!data.hasSufficientData ? INSUFFICIENT_DATA_MESSAGE : EMPTY_INSIGHTS_MESSAGE}
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleInsights.map((insight) => (
                <li
                  key={insight.id}
                  className={cn("rounded-xl border border-border border-l-4 p-4", priorityStyles[insight.priority])}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        <span className="mr-2 inline-flex rounded-full bg-muted/15 px-2 py-0.5 text-xs font-medium text-foreground">
                          {INSIGHT_PRIORITY_LABELS[insight.priority]}
                        </span>
                        {insight.title}
                      </p>
                      <p className="mt-1 text-sm text-muted">{insight.description}</p>
                    </div>
                    <span className="text-xs font-medium text-muted">
                      {insight.confidenceScore}% confidence ({insight.confidence})
                    </span>
                  </div>
                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="text-muted">Reason</dt>
                      <dd className="text-foreground">{insight.reason}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Recommended action</dt>
                      <dd className="text-foreground">{insight.recommendedAction}</dd>
                    </div>
                    {insight.relatedClientName ? (
                      <div>
                        <dt className="text-muted">Related client</dt>
                        <dd className="text-foreground">{insight.relatedClientName}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-muted">Category</dt>
                      <dd className="text-foreground">{INSIGHT_CATEGORY_LABELS[insight.category]}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => copyInsight(insight)}>
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDismissedIds((prev) => new Set(prev).add(insight.id))}
                    >
                      Dismiss
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Recommendations" className="space-y-3 xl:col-span-5">
          <h2 className="text-lg font-semibold text-foreground">Recommendations</h2>
          {data.recommendations.length === 0 ? (
            <p className="text-sm text-muted">No recommendations right now.</p>
          ) : (
            <ul className="space-y-3">
              {data.recommendations.map((item) => (
                <li key={item.id} className="rounded-xl border border-border bg-surface/80 p-4">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">{item.description}</p>
                  {item.href ? (
                    <a href={item.href} className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
                      {item.actionLabel} →
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-label="Client ranking" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Client priority ranking</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/10 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Factors</th>
              </tr>
            </thead>
            <tbody>
              {data.clientRankings.slice(0, 10).map((client) => (
                <tr key={client.clientId} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{client.clientName}</td>
                  <td className="px-4 py-3">{CLIENT_PRIORITY_LABELS[client.label]}</td>
                  <td className="px-4 py-3">{CUSTOMER_HEALTH_LABELS[client.healthLabel]}</td>
                  <td className="px-4 py-3">{client.score}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {client.factors.length > 0 ? client.factors.join(" · ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="AI history" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">AI history (session only)</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No insight generations yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-border bg-muted/5 px-4 py-3 text-xs text-muted">
                {new Date(entry.timestamp).toLocaleString()} · {entry.insightCount} insights ·{" "}
                {entry.provider} · {entry.durationMs}ms
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
