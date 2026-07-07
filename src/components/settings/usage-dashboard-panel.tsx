"use client";

import Link from "next/link";
import type { UsageDashboardData } from "@/lib/billing/types";
import type { EntitlementsUsageSummary } from "@/lib/entitlements/types";
import { PageSurface, PageSurfaceHeading } from "@/components/ui/page-surface";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils/cn";

type UsageDashboardPanelProps = {
  data: UsageDashboardData;
  entitlements: EntitlementsUsageSummary;
};

function UsageBar({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <div className="h-2 rounded-full bg-muted/20" />;
  }

  const tone =
    percent >= 100 ? "bg-danger" : percent >= 85 ? "bg-warning" : "bg-success";

  return (
    <div className="h-2 rounded-full bg-muted/20">
      <div className={cn("h-2 rounded-full", tone)} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
}

export function UsageDashboardPanel({ data, entitlements }: UsageDashboardPanelProps) {
  const { entitlements: resolved } = entitlements;

  return (
    <div className="space-y-8">
      <PageSurface>
        <PageSurfaceHeading
          title="Plan entitlements"
          description="Limits and features for your current subscription. Enforcement is applied server-side."
        />
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-border/70 px-3 py-1 font-medium text-foreground">
            Plan: {resolved.planLabel}
          </span>
          <span
            className={cn(
              "rounded-full border px-3 py-1 font-medium",
              resolved.isPaidAccess
                ? "border-success/25 bg-success/10 text-success"
                : "border-warning/25 bg-warning/10 text-warning",
            )}
          >
            {resolved.isPaidAccess ? "Active subscription" : "Limited access"}
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {entitlements.usage.map((metric) => (
            <div key={metric.key} className="rounded-xl border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium capitalize text-foreground">{metric.label}s</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {metric.used.toLocaleString()}
                    {metric.limit !== null ? (
                      <span className="text-sm font-normal text-muted">
                        {" "}
                        / {metric.limit.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-sm font-normal text-muted"> / Unlimited</span>
                    )}
                  </p>
                </div>
                {metric.atLimit ? (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                    Limit
                  </span>
                ) : metric.approachingLimit ? (
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                    Near limit
                  </span>
                ) : null}
              </div>
              <div className="mt-4">
                <UsageBar percent={metric.percentUsed} />
              </div>
              {metric.remaining !== null ? (
                <p className="mt-2 text-xs text-muted">{metric.remaining.toLocaleString()} remaining</p>
              ) : (
                <p className="mt-2 text-xs text-muted">Unlimited on your plan</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium text-foreground">Included features</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {entitlements.featureLabels.map((label) => (
              <li
                key={label}
                className="rounded-full border border-border/70 bg-muted/5 px-3 py-1 text-xs text-muted"
              >
                {label}
              </li>
            ))}
          </ul>
        </div>

        {entitlements.hasLimitWarning ? (
          <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-foreground">
            <p>You are nearing or have reached a plan limit.</p>
            <FormFooterUpgrade href={entitlements.upgradeHref} />
          </div>
        ) : null}
      </PageSurface>

      <PageSurface>
        <PageSurfaceHeading
          title="Current month"
          description="Live usage aggregated from AI, API, automation, connectors, reports, storage, and team metrics."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.current.metrics.map((metric) => (
            <div key={metric.key} className="rounded-xl border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {metric.used.toLocaleString()}
                    {metric.limit !== null ? (
                      <span className="text-sm font-normal text-muted">
                        {" "}
                        / {metric.limit.toLocaleString()} {metric.unit}
                      </span>
                    ) : (
                      <span className="text-sm font-normal text-muted"> {metric.unit}</span>
                    )}
                  </p>
                </div>
                {metric.atLimit ? (
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                    Limit
                  </span>
                ) : metric.approachingLimit ? (
                  <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                    Near limit
                  </span>
                ) : null}
              </div>
              <div className="mt-4">
                <UsageBar percent={metric.percentUsed} />
              </div>
              {metric.remaining !== null ? (
                <p className="mt-2 text-xs text-muted">{metric.remaining.toLocaleString()} remaining</p>
              ) : (
                <p className="mt-2 text-xs text-muted">Unlimited on your plan</p>
              )}
              {metric.atLimit ? (
                <p className="mt-3 text-xs text-muted">
                  You have reached the {metric.label.toLowerCase()} limit for your current plan.{" "}
                  <Link href="/settings/plans" className="font-medium text-primary hover:underline">
                    Upgrade plan
                  </Link>
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </PageSurface>

      <PageSurface>
        <PageSurfaceHeading title="Trends" description="Current month compared to the previous billing period." />
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-muted">
                <th className="py-2 pr-4 font-medium">Metric</th>
                <th className="py-2 pr-4 font-medium">Current</th>
                <th className="py-2 pr-4 font-medium">Previous</th>
                <th className="py-2 pr-4 font-medium">Change</th>
                <th className="py-2 font-medium">Projected</th>
              </tr>
            </thead>
            <tbody>
              {data.trends.map((trend) => (
                <tr key={trend.key} className="border-b border-border/40">
                  <td className="py-3 pr-4 font-medium text-foreground">{trend.label}</td>
                  <td className="py-3 pr-4 text-muted">{trend.current.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-muted">{trend.previous.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-muted">
                    {trend.changePercent === null ? "—" : `${trend.changePercent > 0 ? "+" : ""}${trend.changePercent}%`}
                  </td>
                  <td className="py-3 text-muted">{trend.projectedEndOfMonth.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSurface>

      <PageSurface>
        <PageSurfaceHeading title="Forecast" description="Projected end-of-month usage and upgrade suggestions." />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {data.forecasts.map((forecast) => (
            <div
              key={forecast.metric}
              className={cn(
                "rounded-xl border p-4",
                forecast.likelyOverage ? "border-warning/40 bg-warning/5" : "border-border/70",
              )}
            >
              <p className="text-sm font-medium text-foreground">{forecast.label}</p>
              <p className="mt-2 text-sm text-muted">
                Projected {forecast.projectedUsage.toLocaleString()}
                {forecast.limit !== null ? ` / ${forecast.limit.toLocaleString()}` : ""} ·{" "}
                {forecast.daysRemaining} day(s) left
              </p>
              {forecast.likelyOverage && forecast.suggestedUpgrade ? (
                <p className="mt-2 text-sm text-warning">
                  Likely overage — consider upgrading to{" "}
                  <Link href="/settings/plans" className="font-medium underline">
                    {forecast.suggestedUpgrade}
                  </Link>
                  .
                </p>
              ) : (
                <p className="mt-2 text-sm text-success">On track for this billing period.</p>
              )}
            </div>
          ))}
        </div>
      </PageSurface>
    </div>
  );
}

function FormFooterUpgrade({ href }: { href: "/settings/plans" }) {
  return (
    <div className="mt-3">
      <LinkButton href={href} variant="primary" size="sm">
        Upgrade plan
      </LinkButton>
    </div>
  );
}
