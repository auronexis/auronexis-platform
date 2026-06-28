import type { UsageDashboardData, UsagePeriodSummary } from "@/lib/billing/types";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const usageSummaryCache = new Map<string, CacheEntry<UsagePeriodSummary>>();
const usageDashboardCache = new Map<string, CacheEntry<UsageDashboardData>>();
const TTL_MS = 60_000;

function cacheKey(organizationId: string, suffix: string): string {
  return `${organizationId}:${suffix}`;
}

export function getCachedUsageSummary(organizationId: string): UsagePeriodSummary | null {
  const entry = usageSummaryCache.get(cacheKey(organizationId, "summary"));
  if (!entry || entry.expiresAt < Date.now()) {
    return null;
  }
  return entry.value;
}

export function setCachedUsageSummary(
  organizationId: string,
  value: UsagePeriodSummary,
): void {
  usageSummaryCache.set(cacheKey(organizationId, "summary"), {
    value,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function getCachedUsageDashboard(organizationId: string): UsageDashboardData | null {
  const entry = usageDashboardCache.get(cacheKey(organizationId, "dashboard"));
  if (!entry || entry.expiresAt < Date.now()) {
    return null;
  }
  return entry.value;
}

export function setCachedUsageDashboard(
  organizationId: string,
  value: UsageDashboardData,
): void {
  usageDashboardCache.set(cacheKey(organizationId, "dashboard"), {
    value,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function invalidateBillingCache(organizationId: string): void {
  usageSummaryCache.delete(cacheKey(organizationId, "summary"));
  usageDashboardCache.delete(cacheKey(organizationId, "dashboard"));
}
