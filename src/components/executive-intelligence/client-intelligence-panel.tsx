import Link from "next/link";
import type { ClientIntelligenceSummary } from "@/lib/executive-intelligence/types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { linkText } from "@/lib/ui/tokens";

type ClientIntelligencePanelProps = {
  summary: ClientIntelligenceSummary;
};

const severityStyles: Record<string, string> = {
  critical: "text-danger",
  high: "text-danger",
  medium: "text-warning",
  low: "text-muted",
  info: "text-primary",
};

export function ClientIntelligencePanel({ summary }: ClientIntelligencePanelProps) {
  const topFinding = summary.findings[0] ?? null;
  const topAction = summary.recommendedActions[0] ?? null;

  return (
    <Card padding="lg" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Client intelligence</h2>
          <p className="mt-1 text-xs text-muted">
            Evidence-backed summary · Generated {new Date(summary.generatedAt).toLocaleString()}
          </p>
          <span className="mt-2 inline-flex rounded-full border border-border/70 px-2 py-0.5 text-xs text-muted">
            {summary.generatedBy === "ai_assisted" ? "AI-assisted" : "Deterministic"}
          </span>
        </div>
        <Link href="/intelligence" className={cn(linkText, "text-xs")}>
          Organization intelligence
        </Link>
      </div>

      <p className="text-sm text-muted">{summary.narrative}</p>

      {topFinding ? (
        <div className="rounded-lg border border-border/70 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-xs font-semibold uppercase", severityStyles[topFinding.severity])}>
              {topFinding.severity}
            </span>
            <span className="text-xs text-muted capitalize">Confidence: {topFinding.confidence}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">{topFinding.title}</p>
          <p className="mt-1 text-xs text-muted">{topFinding.summary}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">No priority findings for this client.</p>
      )}

      {topAction ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-foreground">{topAction.title}</p>
            <p className="mt-1 text-xs text-muted">{topAction.rationale}</p>
          </div>
          {topAction.route && topAction.ctaLabel ? (
            <Link href={topAction.route} className={cn(linkText, "text-xs font-semibold")}>
              {topAction.ctaLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
