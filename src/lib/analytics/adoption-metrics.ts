import { trackAnalyticsEvent } from "@/lib/analytics/events";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function readTimestamp(key: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function writeTimestamp(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // Ignore storage failures.
  }
}

function shouldFirePeriodic(key: string, intervalMs: number): boolean {
  const last = readTimestamp(key);
  const now = Date.now();
  if (last && now - last < intervalMs) return false;
  writeTimestamp(key);
  return true;
}

/** Track weekly active usage once per rolling week — no workspace identifiers. */
export function trackWeeklyActiveUsage(surface: string): void {
  if (!shouldFirePeriodic("auroranexis:analytics:wau", WEEK_MS)) return;
  trackAnalyticsEvent("workspace_reengaged", {
    surface,
    cadence: "weekly",
  });
}

/** Track monthly active usage once per rolling month — no workspace identifiers. */
export function trackMonthlyActiveUsage(surface: string): void {
  if (!shouldFirePeriodic("auroranexis:analytics:mau", MONTH_MS)) return;
  trackAnalyticsEvent("retention_signal", {
    surface,
    cadence: "monthly",
  });
}

/** Track feature adoption for a named capability. */
export function trackFeatureAdoption(feature: string, surface: string): void {
  trackAnalyticsEvent("feature_adopted", { feature, surface });
}

/** Track expansion interest without billing identifiers. */
export function trackExpansionSignal(signal: string, surface: string): void {
  trackAnalyticsEvent("expansion_signal", { signal, surface });
}

/** Track workspace health panel impressions. */
export function trackWorkspaceHealthViewed(surface: string): void {
  trackAnalyticsEvent("workspace_health_viewed", { surface });
}
