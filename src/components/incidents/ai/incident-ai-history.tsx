import type { IncidentAIAnalysis } from "@/lib/ai-incidents/types";
import { formatIncidentAITimestamp } from "@/lib/ai-incidents/types";
import { IncidentAIConfidenceBadge } from "@/components/incidents/ai/incident-ai-confidence-badge";

type IncidentAIHistoryProps = {
  analyses: IncidentAIAnalysis[];
};

export function IncidentAIHistory({ analyses }: IncidentAIHistoryProps) {
  if (analyses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-muted/5 px-4 py-6 text-center">
        <p className="text-sm text-muted">No prior AI analyses for this incident.</p>
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
              <p className="mt-1 text-xs text-muted">{formatIncidentAITimestamp(analysis.created_at)}</p>
            </div>
            <IncidentAIConfidenceBadge confidence={analysis.confidence} />
          </div>
          {analysis.summary ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted">{analysis.summary}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
