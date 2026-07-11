import {
  MIN_TREND_EVENTS,
  TREND_DECLINING_RATIO,
  TREND_IMPROVING_RATIO,
} from "@/lib/adoption/constants";
import type { AdoptionTrend } from "@/lib/adoption/types";

type TrendInput = {
  valueEvents30d: number;
  valueEventsPrevious30d: number;
  isActivated: boolean;
};

/**
 * Compare current vs previous 30-day meaningful value events.
 * improving: current >= previous * 1.2
 * declining: current <= previous * 0.8
 * stable: otherwise
 * insufficient_data: fewer than 3 combined events or not activated
 */
export function resolveAdoptionTrend(input: TrendInput): AdoptionTrend {
  if (!input.isActivated) {
    return "insufficient_data";
  }

  const combined = input.valueEvents30d + input.valueEventsPrevious30d;
  if (combined < MIN_TREND_EVENTS) {
    return "insufficient_data";
  }

  if (input.valueEventsPrevious30d === 0) {
    return input.valueEvents30d > 0 ? "improving" : "insufficient_data";
  }

  const ratio = input.valueEvents30d / input.valueEventsPrevious30d;

  if (ratio >= TREND_IMPROVING_RATIO) {
    return "improving";
  }
  if (ratio <= TREND_DECLINING_RATIO) {
    return "declining";
  }
  return "stable";
}
