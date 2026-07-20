import type { AdoptionTrend } from "@/lib/adoption/types";
import { ADOPTION_TREND_LABELS } from "@/lib/adoption/constants";
import { TrendingDown, TrendingUp, Minus, HelpCircle } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/badge";

const TREND_TONES: Record<AdoptionTrend, StatusBadgeTone> = {
  improving: "success",
  stable: "neutral",
  declining: "danger",
  insufficient_data: "muted",
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
    <StatusBadge
      tone={TREND_TONES[trend]}
      className={className}
      aria-label={`Engagement trend: ${ADOPTION_TREND_LABELS[trend]}`}
    >
      <Icon icon={TrendIcon} size="sm" />
      {ADOPTION_TREND_LABELS[trend]}
    </StatusBadge>
  );
}
