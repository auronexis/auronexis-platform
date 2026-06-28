"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { refreshClientPredictiveServerAction } from "@/lib/predictive/actions";
import type { ClientPredictiveAnalysis } from "@/lib/predictive/types";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type PredictiveClientPanelProps = {
  initialAnalysis: ClientPredictiveAnalysis;
  showRevenue?: boolean;
};

function TrendIcon({ direction }: { direction: "up" | "down" | "flat" }) {
  if (direction === "up") return <ArrowUpRight className="h-4 w-4" aria-hidden="true" />;
  if (direction === "down") return <ArrowDownRight className="h-4 w-4" aria-hidden="true" />;
  return <Minus className="h-4 w-4" aria-hidden="true" />;
}

export function PredictiveClientPanel({
  initialAnalysis,
  showRevenue = true,
}: PredictiveClientPanelProps) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await refreshClientPredictiveServerAction(analysis.clientId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAnalysis(result.data);
    });
  }, [analysis.clientId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            Confidence {analysis.confidence.score}% ({analysis.confidence.label}) · Engine{" "}
            {analysis.engineVersion}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" loading={isPending} onClick={refresh}>
          Refresh
        </Button>
      </div>

      {error ? <FormAlert variant="error">{error}</FormAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Health forecast",
            current: analysis.healthForecast.current,
            projected: analysis.healthForecast.projected,
            direction: analysis.healthForecast.direction,
            suffix: "%",
          },
          {
            label: "Churn probability",
            current: analysis.churnProbability,
            projected: analysis.churnProbability,
            direction: analysis.churnSegment === "likely_churn" ? "down" : "flat",
            suffix: "%",
          },
          {
            label: "Communication forecast",
            current: analysis.communicationForecast.current,
            projected: analysis.communicationForecast.projected,
            direction: analysis.communicationForecast.direction,
            suffix: "%",
          },
          {
            label: "Incident forecast",
            current: analysis.incidentForecast.current,
            projected: analysis.incidentForecast.projected,
            direction: analysis.incidentForecast.direction,
            suffix: "%",
          },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface/80 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold text-foreground">
                {item.current}
                {item.suffix}
              </p>
              <div className="flex items-center gap-1 text-sm text-muted">
                <TrendIcon direction={item.direction as "up" | "down" | "flat"} />
                <span>→ {item.projected}{item.suffix}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface/80 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Segment & trends</p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Churn segment</dt>
            <dd className="mt-1 font-medium capitalize text-foreground">
              {analysis.churnSegment.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Revenue trend</dt>
            <dd className="mt-1 font-medium capitalize text-foreground">
              {showRevenue ? analysis.revenueTrend : "Hidden for your role"}
            </dd>
          </div>
        </dl>
      </div>

      {analysis.recommendations.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">AI recommendations</h3>
          {analysis.recommendations.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium text-foreground">{item.title}</p>
                <span className="text-xs text-muted">
                  {item.confidence.label} ({item.confidence.score}%)
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{item.explanation}</p>
              <p className="mt-1 text-xs text-muted">{item.reason}</p>
              <Link href={item.href} className={cn(linkText, "mt-3 inline-flex text-sm")}>
                View action
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
