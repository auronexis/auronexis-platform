import type { AdoptionTrend } from "@/lib/adoption/types";
import { ADOPTION_TREND_LABELS } from "@/lib/adoption/constants";
import { cn } from "@/lib/utils/cn";
import { TrendingDown, TrendingUp, Minus, HelpCircle } from "lucide-react";
import { Icon } from "@/components/ui/icon";

const TREND_TONES: Record<AdoptionTrend, string> = {
  improving: "bg-success/10 text-success border-success/20",
  stable: "bg-muted/10 text-foreground border-border",
  declining: "bg-danger/10 text-danger border-danger/20",
  insufficient_data: "bg-muted/15 text-muted border-border",
};

const TREND_ICONS = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: HelpCircle,
};

type AdoptionTrendBadgeProps = {
  trend: AdoptionTrend;
  className?: string;
};

export function AdoptionTrendBadge({ trend, className }: AdoptionTrendBadgeProps) {
  const TrendIcon = TREND_ICONS[trend];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TREND_TONES[trend],
        className,
      )}
      aria-label={`Engagement trend: ${ADOPTION_TREND_LABELS[trend]}`}
    >
      <Icon icon={TrendIcon} size="sm" aria-hidden />
      {ADOPTION_TREND_LABELS[trend]}
    </span>
  );
}
