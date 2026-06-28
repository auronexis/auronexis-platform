import type { HistoricalWindowMetrics } from "@/lib/predictive/types";
import type { PredictiveTrendDirection, PredictiveTrendLabel } from "@/lib/predictive/types";

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function directionFromDelta(current: number, previous: number): PredictiveTrendDirection {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

export function trendLabelFromDirection(
  direction: PredictiveTrendDirection,
  invert = false,
): PredictiveTrendLabel {
  if (direction === "flat") return "stable";
  const improving = invert ? direction === "down" : direction === "up";
  return improving ? "improving" : "declining";
}

export function projectLinearForecast(current: number, changePercent: number | null): number {
  if (changePercent == null) return current;
  return Math.max(0, Math.round(current * (1 + changePercent / 100)));
}

export function compareWindows(
  currentWindow: HistoricalWindowMetrics,
  previousWindow: HistoricalWindowMetrics,
): Array<{
  metric: string;
  current: number;
  historical: number;
  changePercent: number | null;
  direction: PredictiveTrendDirection;
  trend: PredictiveTrendLabel;
  projected: number;
}> {
  const pairs: Array<{
    metric: string;
    current: number;
    historical: number;
    invert?: boolean;
  }> = [
    { metric: "Incidents", current: currentWindow.incidents, historical: previousWindow.incidents, invert: true },
    { metric: "Risks", current: currentWindow.risks, historical: previousWindow.risks, invert: true },
    {
      metric: "Reports published",
      current: currentWindow.reportsPublished,
      historical: previousWindow.reportsPublished,
    },
    {
      metric: "SLA breaches",
      current: currentWindow.slaBreaches,
      historical: previousWindow.slaBreaches,
      invert: true,
    },
  ];

  return pairs.map((pair) => {
    const changePercent = percentChange(pair.current, pair.historical);
    const direction = directionFromDelta(pair.current, pair.historical);
    return {
      metric: pair.metric,
      current: pair.current,
      historical: pair.historical,
      changePercent,
      direction,
      trend: trendLabelFromDirection(direction, pair.invert),
      projected: projectLinearForecast(pair.current, changePercent),
    };
  });
}

export function forecastMetric(
  label: string,
  current: number,
  historical: number,
  invertTrend = false,
): {
  label: string;
  current: number;
  projected: number;
  direction: PredictiveTrendDirection;
  trend: PredictiveTrendLabel;
} {
  const changePercent = percentChange(current, historical);
  const direction = directionFromDelta(current, historical);
  return {
    label,
    current,
    projected: projectLinearForecast(current, changePercent),
    direction,
    trend: trendLabelFromDirection(direction, invertTrend),
  };
}

export function projectRecurringRevenue(
  currentRevenue: number,
  healthyAccounts: number,
  decliningAccounts: number,
  totalAccounts: number,
): number {
  if (totalAccounts === 0) return currentRevenue;
  const growthFactor = 1 + (healthyAccounts / totalAccounts) * 0.02;
  const declineFactor = 1 - (decliningAccounts / totalAccounts) * 0.03;
  return Math.max(0, Math.round(currentRevenue * growthFactor * declineFactor));
}
