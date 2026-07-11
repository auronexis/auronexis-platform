import { MAX_PERIOD_DAYS } from "@/lib/executive-intelligence/constants";
import type { IntelligencePeriod, IntelligencePeriodPreset } from "@/lib/executive-intelligence/types";

function toIso(date: Date): string {
  return date.toISOString();
}

function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
}

export function resolveIntelligencePeriod(
  preset: IntelligencePeriodPreset = "30d",
  reference = new Date(),
): IntelligencePeriod {
  if (preset === "month") {
    const currentStart = startOfMonthUtc(reference);
    const currentEnd = endOfMonthUtc(reference);
    const previousRef = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 1, 15));
    const previousStart = startOfMonthUtc(previousRef);
    const previousEnd = endOfMonthUtc(previousRef);
    const formatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
    return {
      currentStart: toIso(currentStart),
      currentEnd: toIso(currentEnd),
      comparisonStart: toIso(previousStart),
      comparisonEnd: toIso(previousEnd),
      label: `${formatter.format(currentStart)} vs ${formatter.format(previousStart)}`,
      preset,
    };
  }

  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  if (days > MAX_PERIOD_DAYS) {
    throw new Error(`Period exceeds maximum of ${MAX_PERIOD_DAYS} days.`);
  }

  const currentEnd = reference;
  const currentStart = new Date(reference.getTime() - days * 86400000);
  const comparisonEnd = new Date(currentStart.getTime() - 1);
  const comparisonStart = new Date(comparisonEnd.getTime() - days * 86400000);

  return {
    currentStart: toIso(currentStart),
    currentEnd: toIso(currentEnd),
    comparisonStart: toIso(comparisonStart),
    comparisonEnd: toIso(comparisonEnd),
    label: `Last ${days} days vs previous ${days} days`,
    preset,
  };
}

export function validatePeriodRange(start: string, end: string): boolean {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || s >= e) return false;
  const days = (e - s) / 86400000;
  return days <= MAX_PERIOD_DAYS;
}
