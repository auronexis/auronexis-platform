import { formatHealthScore, healthScoreTone } from "@/lib/clients/types";
import { cn } from "@/lib/utils/cn";

const toneStyles = {
  healthy: "bg-green-50 text-success ring-green-600/20",
  watch: "bg-amber-50 text-warning ring-amber-600/20",
  critical: "bg-red-50 text-critical ring-red-600/20",
  muted: "bg-muted/10 text-muted ring-border-subtle",
};

type ClientHealthScoreProps = {
  score: number | null | undefined;
  className?: string;
};

export function ClientHealthScore({ score, className }: ClientHealthScoreProps) {
  const tone = healthScoreTone(score);
  const label = formatHealthScore(score);

  return (
    <span
      className={cn(
        "inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneStyles[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
