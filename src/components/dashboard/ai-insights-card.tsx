"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EMPTY_INSIGHTS_MESSAGE,
  INSIGHT_PRIORITY_LABELS,
  type OperationalInsight,
} from "@/lib/ai/insights/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

const priorityStyles: Record<OperationalInsight["priority"], string> = {
  critical: "border-danger/30 bg-danger/5 text-danger",
  high: "border-warning/30 bg-warning/5 text-warning",
  medium: "border-primary/20 bg-primary/5 text-primary",
  low: "border-border bg-muted/5 text-muted",
};

type AIInsightsCardProps = {
  insights: OperationalInsight[];
  aiEnabled: boolean;
  upgradeMessage: string;
  requiredPlanLabel?: string;
};

export function AIInsightsCard({
  insights,
  aiEnabled,
  upgradeMessage,
  requiredPlanLabel,
}: AIInsightsCardProps) {
  if (!aiEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/[0.04] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">AI Insights</p>
            <p className="mt-2 text-sm text-muted">{upgradeMessage}</p>
            {requiredPlanLabel ? (
              <p className="mt-1 text-xs font-medium text-foreground">
                {requiredPlanLabel} plan required
              </p>
            ) : null}
            <Link href="/settings/plans">
              <Button type="button" variant="primary" size="sm" className="mt-4">
                View plans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const topInsights = insights.slice(0, 5);

  return (
    <div className="space-y-4">
      {topInsights.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/5 px-4 py-6 text-sm text-muted">
          {EMPTY_INSIGHTS_MESSAGE}
        </p>
      ) : (
        <ul className="space-y-3">
          {topInsights.map((insight) => (
            <li
              key={insight.id}
              className="rounded-xl border border-border bg-surface/80 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{insight.description}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    priorityStyles[insight.priority],
                  )}
                >
                  {INSIGHT_PRIORITY_LABELS[insight.priority]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link href="/dashboard/insights" className={cn(linkText, "inline-flex items-center gap-1 text-sm")}>
        View all
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
