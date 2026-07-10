"use client";

import Link from "next/link";
import type { CopilotAnswer, CopilotRecommendation } from "@/lib/ai/copilot/types";
import { buildSourceHref } from "@/lib/ai/copilot/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

const confidenceStyles = {
  high: "text-success",
  medium: "text-warning",
  low: "text-muted",
} as const;

const priorityStyles = {
  low: "border-border text-muted",
  medium: "border-warning/40 text-warning",
  high: "border-danger/40 text-danger",
  critical: "border-danger text-danger",
} as const;

type CopilotAnswerPanelProps = {
  answer: CopilotAnswer;
  onCopy?: () => void;
  className?: string;
};

export function CopilotAnswerPanel({ answer, onCopy, className }: CopilotAnswerPanelProps) {
  return (
    <section
      aria-label="AI-generated answer"
      aria-live="polite"
      className={cn("space-y-5 rounded-xl border border-border bg-surface/80 p-5", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            AI-generated · Verify important decisions
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{answer.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Confidence</span>
          <span className={cn("text-xs font-semibold capitalize", confidenceStyles[answer.confidence])}>
            {answer.confidence}
          </span>
          {onCopy ? (
            <Button type="button" variant="outline" size="sm" onClick={onCopy}>
              Copy answer
            </Button>
          ) : null}
        </div>
      </div>

      <div className="prose prose-sm max-w-none text-sm text-foreground">
        <p className="whitespace-pre-wrap">{answer.answer}</p>
      </div>

      {answer.facts.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-foreground">Verified facts</h3>
          <ul className="mt-2 space-y-2" role="list">
            {answer.facts.map((fact, index) => {
              const href = buildSourceHref(fact.sourceType, fact.sourceId);
              return (
                <li
                  key={`${fact.sourceLabel}-${index}`}
                  className="rounded-md border border-border/70 bg-muted/5 px-3 py-2 text-sm"
                >
                  <p className="text-foreground">{fact.statement}</p>
                  <p className="mt-1 text-xs text-muted">
                    Source:{" "}
                    {href ? (
                      <Link href={href} className={cn("font-medium text-primary hover:underline", focusRing)}>
                        {fact.sourceLabel}
                      </Link>
                    ) : (
                      fact.sourceLabel
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {answer.recommendations.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-foreground">Recommendations (not verified facts)</h3>
          <ul className="mt-2 space-y-2" role="list">
            {answer.recommendations.map((item) => (
              <RecommendationItem key={item.title} item={item} />
            ))}
          </ul>
        </div>
      ) : null}

      {answer.limitations.length > 0 ? (
        <div className="rounded-md border border-dashed border-border-strong bg-muted/5 px-3 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Limitations</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
            {answer.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function RecommendationItem({ item }: { item: CopilotRecommendation }) {
  const href = item.href;

  return (
    <li className={cn("rounded-md border px-3 py-2 text-sm", priorityStyles[item.priority])}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-foreground">{item.title}</p>
        <span className="text-[10px] font-semibold uppercase tracking-wide">{item.priority}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{item.reason}</p>
      {href ? (
        <Link
          href={href}
          className={cn("mt-2 inline-flex text-xs font-medium text-primary hover:underline", focusRing, transitionInteractive)}
        >
          View related record
        </Link>
      ) : null}
    </li>
  );
}
