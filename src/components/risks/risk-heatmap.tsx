import type { RiskHeatmap } from "@/lib/risks/types";
import { getRiskLevelFromScore } from "@/lib/risks/scoring";
import { cn } from "@/lib/utils/cn";

type RiskHeatmapProps = {
  heatmap: RiskHeatmap;
  compact?: boolean;
  className?: string;
};

const levelStyles = {
  low: "bg-green-100/80 text-success",
  medium: "bg-amber-100/80 text-warning",
  high: "bg-orange-100/80 text-orange-700",
  critical: "bg-red-100/80 text-critical",
};

function cellStyle(likelihood: number, impact: number, count: number, maxCount: number): string {
  if (count === 0) {
    return "bg-muted/5 text-muted";
  }

  const score = likelihood * impact;
  const level = getRiskLevelFromScore(score);
  const intensity = maxCount > 0 ? Math.max(0.35, count / maxCount) : 1;
  return cn(levelStyles[level], intensity < 0.6 && "opacity-70");
}

export function RiskHeatmap({ heatmap, compact = false, className }: RiskHeatmapProps) {
  const { cells, maxCount } = heatmap;
  const hasData = cells.some((cell) => cell.count > 0);

  if (!hasData) {
    return (
      <p className={cn("text-sm text-muted", className)}>
        No open risks to plot on the heatmap yet.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-[auto_repeat(5,minmax(0,1fr))] gap-1 text-xs">
        <div />
        {[1, 2, 3, 4, 5].map((impact) => (
          <div key={impact} className="text-center font-medium text-muted">
            {compact ? impact : `Impact ${impact}`}
          </div>
        ))}
        {[5, 4, 3, 2, 1].map((likelihood) => (
          <div key={likelihood} className="contents">
            <div className="flex items-center justify-end pr-2 font-medium text-muted">
              {compact ? likelihood : `L${likelihood}`}
            </div>
            {[1, 2, 3, 4, 5].map((impact) => {
              const cell = cells.find(
                (item) => item.likelihood === likelihood && item.impact === impact,
              );
              const count = cell?.count ?? 0;
              return (
                <div
                  key={`${likelihood}-${impact}`}
                  title={`Likelihood ${likelihood} × Impact ${impact}: ${count} risk(s)`}
                  className={cn(
                    "flex min-h-8 items-center justify-center rounded-md text-xs font-semibold",
                    cellStyle(likelihood, impact, count, maxCount),
                  )}
                >
                  {count > 0 ? count : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {!compact ? (
        <p className="text-xs text-muted">
          Likelihood (rows) × Impact (columns). Cell color reflects composite risk score.
        </p>
      ) : null}
    </div>
  );
}
