"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AIUsageSummary } from "@/lib/ai/types";
import { cn } from "@/lib/utils/cn";

type AIUsageCardProps = {
  usageSummary: AIUsageSummary;
  averageLatencyMs?: number | null;
  lastGenerationAt?: string | null;
  className?: string;
};

/** Unified AI usage card — consistent across all modules. */
export function AIUsageCard({
  usageSummary,
  averageLatencyMs,
  lastGenerationAt,
  className,
}: AIUsageCardProps) {
  const {
    callsThisMonth,
    limit,
    unlimitedCredits,
    totalTokensThisMonth,
    lastProvider,
    lastModel,
    hasUsage,
    remainingCalls,
  } = usageSummary;
  const percent =
    !unlimitedCredits && limit > 0
      ? Math.min(100, Math.round((callsThisMonth / limit) * 100))
      : 0;

  return (
    <div
      className={cn("rounded-lg border border-border bg-surface/80 p-4", className)}
      aria-label={`AI Usage: ${callsThisMonth} of ${limit} calls this month`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">AI Usage</p>
        <p className="text-xs text-muted">
          {unlimitedCredits ? (
            <>{callsThisMonth} calls · Unlimited plan</>
          ) : (
            <>
              {callsThisMonth} / {limit} calls
            </>
          )}
        </p>
      </div>

      {limit > 0 && !unlimitedCredits ? (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted/15"
          role="progressbar"
          aria-valuenow={callsThisMonth}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-label="AI usage progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}

      <div className="mt-3 space-y-1 text-xs text-muted">
        {!hasUsage ? (
          <p>No AI generation yet.</p>
        ) : (
          <>
            {totalTokensThisMonth != null ? (
              <p>Estimated tokens this month: {totalTokensThisMonth.toLocaleString()}</p>
            ) : null}
            {averageLatencyMs != null ? <p>Average latency: {averageLatencyMs}ms</p> : null}
            {lastGenerationAt ? (
              <p>Last generation: {new Date(lastGenerationAt).toLocaleString()}</p>
            ) : null}
            {lastProvider && lastModel ? (
              <p>
                Provider: {lastProvider} · Model: {lastModel}
              </p>
            ) : null}
          </>
        )}
        <p>
          Remaining quota:{" "}
          {unlimitedCredits
            ? "Unlimited"
            : `${remainingCalls} call${remainingCalls === 1 ? "" : "s"}`}
        </p>
      </div>
    </div>
  );
}

type AIUpgradeCardProps = {
  title: string;
  message: string;
  requiredPlanLabel?: string;
  description?: string;
  className?: string;
};

export function AIUpgradeCard({
  title,
  message,
  requiredPlanLabel,
  description,
  className,
}: AIUpgradeCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-primary/25 bg-primary/[0.04] p-5 text-center",
        className,
      )}
      role="region"
      aria-label={`${title} upgrade required`}
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted">{message}</p>
      {requiredPlanLabel ? (
        <p className="mt-1 text-xs font-medium text-foreground">{requiredPlanLabel} plan required</p>
      ) : null}
      {description ? <p className="mt-3 text-sm text-muted">{description}</p> : null}
      <Link href="/settings/plans">
        <Button type="button" variant="primary" size="sm" className="mt-4">
          View plans
        </Button>
      </Link>
    </div>
  );
}
