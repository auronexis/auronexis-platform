import type { IntelligencePeriodPreset } from "@/lib/executive-intelligence/types";

export const DEFAULT_PERIOD_PRESET: IntelligencePeriodPreset = "30d";

export const MAX_PERIOD_DAYS = 90;
export const MAX_PRIORITY_CLIENTS = 25;
export const MAX_FINDINGS = 20;
export const MAX_AI_NARRATIVE_LENGTH = 4000;
export const MAX_BRIEFING_SUMMARY_LENGTH = 1000;

/** Minimum absolute change to flag as moderate. */
export const CHANGE_MODERATE_THRESHOLD = 2;
/** Minimum absolute change to flag as major. */
export const CHANGE_MAJOR_THRESHOLD = 5;
/** Percentage change threshold when baseline >= 3. */
export const CHANGE_PERCENT_MODERATE = 15;
export const CHANGE_PERCENT_MAJOR = 30;

/** Anomaly thresholds. */
export const ANOMALY_RISK_SPIKE = 3;
export const ANOMALY_INCIDENT_SPIKE = 2;
export const ANOMALY_REPORT_DROP_PERCENT = 40;
export const ANOMALY_OVERDUE_TASK_SPIKE = 3;
export const ANOMALY_MONITORING_FAILURE_SPIKE = 2;

/** AI generation rate limits per organization. */
export const AI_RATE_LIMIT_PER_MINUTE = 6;
export const AI_RATE_LIMIT_PER_DAY = 50;

/** Cache TTL in milliseconds. */
export const SNAPSHOT_CACHE_TTL_MS = 60_000;
export const NARRATIVE_CACHE_TTL_MS = 300_000;

export const PERIOD_PRESET_LABELS: Record<IntelligencePeriodPreset, string> = {
  "7d": "Last 7 days vs previous 7 days",
  "30d": "Last 30 days vs previous 30 days",
  "90d": "Last 90 days vs previous 90 days",
  month: "Current month vs previous month",
};
