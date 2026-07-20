import { getRiskLevelFromScore, getRiskScoreLevelLabel } from "@/lib/risks/scoring";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type RiskScoreBadgeProps = {
  score: number | null | undefined;
  likelihood?: number | null;
  impact?: number | null;
  showBreakdown?: boolean;
  className?: string;
};

const levelTones: Record<"low" | "medium" | "high" | "critical", StatusBadgeTone> = {
  low: "success",
  medium: "warning",
  high: "orange",
  critical: "danger",
};

export function RiskScoreBadge({
  score,
  likelihood,
  impact,
  showBreakdown = false,
  className,
}: RiskScoreBadgeProps) {
  if (score === null || score === undefined) {
    return <span className={cn("text-sm text-muted", className)}>—</span>;
  }

  const level = getRiskLevelFromScore(score);

  return (
    <span className={cn("inline-flex flex-col gap-0.5", className)}>
      <StatusBadge tone={levelTones[level]}>
        {score} · {getRiskScoreLevelLabel(score)}
      </StatusBadge>
      {showBreakdown && likelihood && impact ? (
        <span className="text-[11px] text-muted">
          L{likelihood} × I{impact}
        </span>
      ) : null}
    </span>
  );
}
