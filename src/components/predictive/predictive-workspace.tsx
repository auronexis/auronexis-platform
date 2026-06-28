"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { refreshPredictiveIntelligenceServerAction } from "@/lib/predictive/actions";
import type { PredictiveIntelligenceResult } from "@/lib/predictive/types";
import { formatCurrency } from "@/lib/profitability/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type PredictiveWorkspaceProps = {
  initialData: PredictiveIntelligenceResult;
  showRevenue?: boolean;
};

function TrendIcon({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up") return <ArrowUpRight className="h-4 w-4" aria-hidden="true" />;
  if (direction === "down") return <ArrowDownRight className="h-4 w-4" aria-hidden="true" />;
  return <Minus className="h-4 w-4" aria-hidden="true" />;
}

function ForecastSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface/80 p-5">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function PredictiveWorkspace({ initialData, showRevenue = true }: PredictiveWorkspaceProps) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await refreshPredictiveIntelligenceServerAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setData(result.data);
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>
              Confidence {data.overallConfidence.score}% ({data.overallConfidence.label}) ·{" "}
              {data.forecastCount} forecasts
            </span>
          </div>
          <p className="mt-2 text-sm text-foreground">{data.executiveOverview}</p>
        </div>
        <Button type="button" variant="outline" size="sm" loading={isPending} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.trends.map((trend) => (
          <div key={trend.metric} className="rounded-xl border border-border bg-surface/80 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{trend.metric}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold text-foreground">{trend.current}</p>
              <div className="flex items-center gap-1 text-sm text-muted">
                <TrendIcon direction={trend.direction} />
                {trend.changePercent != null ? `${trend.changePercent > 0 ? "+" : ""}${trend.changePercent}%` : "—"}
              </div>
            </div>
            <p className="mt-1 text-xs capitalize text-muted">{trend.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ForecastSection
          title="Customer Forecast"
          description="Churn likelihood and account stability from verified signals."
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Likely churn</h3>
              {data.customerForecast.likelyChurn.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No elevated churn signals.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {data.customerForecast.likelyChurn.map((item) => (
                    <li key={item.clientName} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.clientName}</span>
                      <span className="text-muted">{item.churnProbability}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Stable customers</h3>
              <p className="mt-2 text-sm text-muted">
                {data.customerForecast.stableCustomers.length} account(s) within stable range.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Growing customers</h3>
              <p className="mt-2 text-sm text-muted">
                {data.customerForecast.growingCustomers.length} account(s) with improving health trends.
              </p>
            </div>
          </div>
        </ForecastSection>

        <ForecastSection
          title="SLA Forecast"
          description="Upcoming breach probability based on open items and history."
        >
          {data.slaForecast.upcomingBreaches.length === 0 ? (
            <p className="text-sm text-muted">No elevated SLA breach probability detected.</p>
          ) : (
            <ul className="space-y-3">
              {data.slaForecast.upcomingBreaches.map((item) => (
                <li key={item.clientName} className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={item.href} className={cn(linkText, "text-sm font-medium")}>
                      {item.clientName}
                    </Link>
                    <span className="text-sm text-muted">{item.breachProbability}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {item.openItems} open item(s) · {item.confidence.label} confidence
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ForecastSection>

        <ForecastSection
          title="Incident Forecast"
          description="Clients likely to generate incidents with severity prediction."
        >
          {data.incidentForecast.atRiskClients.length === 0 ? (
            <p className="text-sm text-muted">No elevated incident probability detected.</p>
          ) : (
            <ul className="space-y-3">
              {data.incidentForecast.atRiskClients.map((item) => (
                <li key={item.clientName} className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={item.href} className={cn(linkText, "text-sm font-medium")}>
                      {item.clientName}
                    </Link>
                    <span className="text-sm text-muted">{item.incidentProbability}%</span>
                  </div>
                  <p className="mt-1 text-xs capitalize text-muted">
                    Severity: {item.predictedSeverity} · {item.confidence.label} confidence
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ForecastSection>

        <ForecastSection
          title="Revenue Forecast"
          description="Projected recurring revenue from verified financial health signals."
        >
          {!showRevenue ? (
            <p className="text-sm text-muted">Revenue forecast hidden for your role.</p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Current MRR</dt>
                <dd className="font-medium text-foreground">
                  {data.revenueForecast.currentRecurringRevenue != null
                    ? formatCurrency(data.revenueForecast.currentRecurringRevenue)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Projected MRR</dt>
                <dd className="font-medium text-foreground">
                  {data.revenueForecast.projectedRecurringRevenue != null
                    ? formatCurrency(data.revenueForecast.projectedRecurringRevenue)
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Healthy accounts</dt>
                <dd className="font-medium text-foreground">{data.revenueForecast.healthyAccounts}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Declining accounts</dt>
                <dd className="font-medium text-foreground">{data.revenueForecast.decliningAccounts}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Trend</dt>
                <dd className="font-medium capitalize text-foreground">{data.revenueForecast.trend}</dd>
              </div>
            </dl>
          )}
        </ForecastSection>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/80 p-5">
          <h2 className="text-lg font-semibold text-foreground">Client ranking</h2>
          <ul className="mt-4 space-y-2">
            {data.clientRankings.map((client, index) => (
              <li key={client.clientName} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted">{index + 1}.</span>
                <Link href={client.href} className={cn(linkText, "flex-1 font-medium")}>
                  {client.clientName}
                </Link>
                <span className="text-muted">P{client.priorityScore}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface/80 p-5">
          <h2 className="text-lg font-semibold text-foreground">Historical windows</h2>
          <div className="mt-4 space-y-3">
            {data.historicalWindows.map((window) => (
              <div key={window.key} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{window.label}</p>
                <p className="mt-1 text-xs text-muted">
                  Incidents {window.incidents} · Risks {window.risks} · Reports {window.reportsPublished} ·
                  SLA breaches {window.slaBreaches}
                  {window.automationSuccessRate != null
                    ? ` · Automation ${window.automationSuccessRate}%`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/80 p-5">
          <h2 className="text-lg font-semibold text-foreground">Risks</h2>
          <ul className="mt-4 space-y-3">
            {data.risks.length === 0 ? (
              <li className="text-sm text-muted">No anomalies detected.</li>
            ) : (
              data.risks.map((risk) => (
                <li key={risk.title} className="text-sm">
                  <p className="font-medium text-foreground">{risk.title}</p>
                  <p className="mt-1 text-muted">{risk.description}</p>
                  {risk.href ? (
                    <Link href={risk.href} className={cn(linkText, "mt-2 inline-flex text-xs")}>
                      Investigate
                    </Link>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-surface/80 p-5">
          <h2 className="text-lg font-semibold text-foreground">Opportunities</h2>
          <ul className="mt-4 space-y-3">
            {data.opportunities.map((item) => (
              <li key={item.title} className="text-sm">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-muted">{item.description}</p>
                {item.href ? (
                  <Link href={item.href} className={cn(linkText, "mt-2 inline-flex text-xs")}>
                    View
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface/80 p-5">
        <h2 className="text-lg font-semibold text-foreground">Recommendations</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.recommendations.map((item) => (
            <article key={item.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                <span className="text-xs text-muted">
                  {item.confidence.label} ({item.confidence.score}%)
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{item.explanation}</p>
              <p className="mt-1 text-xs text-muted">{item.reason}</p>
              <Link href={item.href} className={cn(linkText, "mt-3 inline-flex text-sm")}>
                Take action
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
