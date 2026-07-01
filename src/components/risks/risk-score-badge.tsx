import { getRiskLevelFromScore, getRiskScoreLevelLabel } from "@/lib/risks/scoring";
import { cn } from "@/lib/utils/cn";

type RiskScoreBadgeProps = {
  score: number | null | undefined;
  likelihood?: number | null;
  impact?: number | null;
  showBreakdown?: boolean;
  className?: string;
};

const levelStyles = {
  low: "bg-green-50 text-success ring-green-600/20",
  medium: "bg-amber-50 text-warning ring-amber-600/20",
  high: "bg-orange-50 text-orange-700 ring-orange-600/20",
  critical: "bg-red-50 text-critical ring-red-600/20",
};

export function RiskScoreBadge({
  score,
  likelihood,
  impact,
  showBreakdown = false,
  className,
}: RiskScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className={cn("text-sm text-muted", className)}>—</span>
    );
  }

  const level = getRiskLevelFromScore(score);

  return (
    <span className={cn("inline-flex flex-col gap-0.5", className)}>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
          levelStyles[level],
        )}
      >
        {score} · {getRiskScoreLevelLabel(score)}
      </span>
      {showBreakdown && likelihood && impact ? (
        <span className="text-[11px] text-muted">
          L{likelihood} × I{impact}
        </span>
      ) : null}
    </span>
  );
}
