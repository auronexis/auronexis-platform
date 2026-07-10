/** Production-only analytics runtime gate — no tracking in development. */

export function isProductionAnalyticsRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}
