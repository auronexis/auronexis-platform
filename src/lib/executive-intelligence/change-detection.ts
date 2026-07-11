import {
  CHANGE_MAJOR_THRESHOLD,
  CHANGE_MODERATE_THRESHOLD,
  CHANGE_PERCENT_MAJOR,
  CHANGE_PERCENT_MODERATE,
} from "@/lib/executive-intelligence/constants";
import { buildEvidence } from "@/lib/executive-intelligence/evidence";
import type { IntelligenceChange, IntelligenceMetric } from "@/lib/executive-intelligence/types";

export function computeMetricChange(
  key: string,
  label: string,
  current: number | null,
  previous: number | null,
  interpretationPositiveWhenUp = true,
  route: string | null = null,
): IntelligenceMetric {
  if (current === null && previous === null) {
    return {
      key,
      label,
      currentValue: null,
      previousValue: null,
      unit: "count",
      direction: "unknown",
      changeAbsolute: null,
      changePercentage: null,
      interpretation: "unknown",
      evidence: [
        buildEvidence({
          sourceType: "calculated",
          sourceKey: key,
          label,
          value: null,
          route,
        }),
      ],
    };
  }

  const cur = current ?? 0;
  const prev = previous ?? 0;
  const changeAbsolute = cur - prev;
  let changePercentage: number | null = null;
  if (prev >= 3) {
    changePercentage = Math.round((changeAbsolute / prev) * 100);
  }

  let direction: IntelligenceMetric["direction"] = "stable";
  if (changeAbsolute > 0) direction = "up";
  else if (changeAbsolute < 0) direction = "down";

  let interpretation: IntelligenceMetric["interpretation"] = "neutral";
  if (changeAbsolute !== 0) {
    const positive = interpretationPositiveWhenUp ? changeAbsolute > 0 : changeAbsolute < 0;
    interpretation = positive ? "positive" : "negative";
  }

  return {
    key,
    label,
    currentValue: current,
    previousValue: previous,
    unit: key.includes("score") || key.includes("health") ? "score" : "count",
    direction,
    changeAbsolute,
    changePercentage,
    interpretation,
    evidence: [
      buildEvidence({
        sourceType: "calculated",
        sourceKey: key,
        label: `${label} (current)`,
        value: cur,
        route,
      }),
      buildEvidence({
        sourceType: "calculated",
        sourceKey: `${key}_previous`,
        label: `${label} (previous)`,
        value: prev,
        route,
      }),
    ],
  };
}

export function buildIntelligenceChange(
  key: string,
  label: string,
  current: number | null,
  previous: number | null,
  interpretationPositiveWhenUp = true,
  route: string | null = null,
): IntelligenceChange | null {
  const metric = computeMetricChange(key, label, current, previous, interpretationPositiveWhenUp, route);
  if (metric.changeAbsolute === null || metric.changeAbsolute === 0) return null;

  const abs = Math.abs(metric.changeAbsolute);
  let significance: IntelligenceChange["significance"] = "minor";
  if (abs >= CHANGE_MAJOR_THRESHOLD || (metric.changePercentage !== null && Math.abs(metric.changePercentage) >= CHANGE_PERCENT_MAJOR)) {
    significance = "major";
  } else if (abs >= CHANGE_MODERATE_THRESHOLD || (metric.changePercentage !== null && Math.abs(metric.changePercentage) >= CHANGE_PERCENT_MODERATE)) {
    significance = "moderate";
  }

  return {
    key,
    label,
    currentValue: metric.currentValue,
    previousValue: metric.previousValue,
    absoluteChange: metric.changeAbsolute,
    percentageChange: metric.changePercentage,
    direction: metric.direction,
    significance,
    interpretation: metric.interpretation,
    evidence: metric.evidence,
  };
}

export function classifyChanges(changes: IntelligenceChange[]): {
  criticalChanges: IntelligenceChange[];
  positiveChanges: IntelligenceChange[];
  negativeChanges: IntelligenceChange[];
} {
  const criticalChanges = changes.filter(
    (c) => c.significance === "major" && c.interpretation === "negative",
  );
  const positiveChanges = changes.filter((c) => c.interpretation === "positive");
  const negativeChanges = changes.filter((c) => c.interpretation === "negative");
  return { criticalChanges, positiveChanges, negativeChanges };
}
