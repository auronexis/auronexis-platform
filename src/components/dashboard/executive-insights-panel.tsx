import Link from "next/link";
import type { ExecutiveInsight } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils/cn";
import { focusRing, transitionInteractive } from "@/lib/ui/tokens";

type ExecutiveInsightsPanelProps = {
  insights: ExecutiveInsight[];
};

const toneStyles: Record<ExecutiveInsight["tone"], string> = {
  default: "border-border/70 bg-surface/60",
  success: "border-success/20 bg-success/5",
  warning: "border-warning/20 bg-warning/5",
  danger: "border-danger/20 bg-danger/5",
  info: "border-primary/20 bg-primary/5",
};

const valueToneStyles: Record<ExecutiveInsight["tone"], string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-primary",
};

export function ExecutiveInsightsPanel({ insights }: ExecutiveInsightsPanelProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {insights.map((insight) => (
        <Link
          key={insight.id}
          href={insight.href}
          className={cn(
            "rounded-xl border p-4",
            toneStyles[insight.tone],
            transitionInteractive,
            "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-interactive",
            focusRing,
          )}
        >
          <p className="text-sm font-medium text-foreground">{insight.title}</p>
          <p className={cn("mt-2 text-2xl font-semibold tracking-tight", valueToneStyles[insight.tone])}>
            {insight.value}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">{insight.description}</p>
        </Link>
      ))}
    </div>
  );
}
