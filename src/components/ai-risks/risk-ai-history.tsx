import type { RiskAIAnalysis } from "@/lib/ai-risks/types";
import { formatRiskAITimestamp } from "@/lib/ai-risks/types";
import { RiskAIConfidenceBadge } from "@/components/ai-risks/risk-ai-confidence-badge";

type RiskAIHistoryProps = {
  analyses: RiskAIAnalysis[];
};

export function RiskAIHistory({ analyses }: RiskAIHistoryProps) {
  if (analyses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-6 text-center">
        <p className="text-sm text-muted">No prior AI analyses for this risk.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70">
      {analyses.map((analysis) => (
        <li key={analysis.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                {analysis.provider} · {analysis.model}
              </p>
              <p className="mt-1 text-xs text-muted">{formatRiskAITimestamp(analysis.created_at)}</p>
            </div>
            <RiskAIConfidenceBadge confidence={analysis.confidence} />
          </div>
          {analysis.summary ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted">{analysis.summary}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
