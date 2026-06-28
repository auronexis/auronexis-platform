"use client";

import type { AIConfidenceScore } from "@/lib/ai/types";
import { cn } from "@/lib/utils/cn";

type ReportAIConfidenceProps = {
  confidence: AIConfidenceScore | null;
};

export function ReportAIConfidence({ confidence }: ReportAIConfidenceProps) {
  if (!confidence) {
    return null;
  }

  const tone =
    confidence.score >= 80
      ? "text-success"
      : confidence.score >= 55
        ? "text-warning"
        : "text-muted";

  return (
    <section
      aria-label={`AI confidence ${confidence.score} percent`}
      className="rounded-lg border border-border bg-surface/80 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">AI confidence</p>
        <p className={cn("text-sm font-semibold", tone)}>{confidence.score}%</p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted/15"
        role="progressbar"
        aria-valuenow={confidence.score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            confidence.score >= 80
              ? "bg-success"
              : confidence.score >= 55
                ? "bg-warning"
                : "bg-muted",
          )}
          style={{ width: `${confidence.score}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{confidence.label} confidence based on available context.</p>
    </section>
  );
}
