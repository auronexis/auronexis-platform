import type { ComplianceDashboardData } from "@/lib/compliance/types";

const dashboardCache = new Map<string, { value: ComplianceDashboardData; expiresAt: number }>();
const TTL_MS = 60_000;

export function getCachedComplianceDashboard(organizationId: string): ComplianceDashboardData | null {
  const entry = dashboardCache.get(organizationId);
  if (!entry || entry.expiresAt < Date.now()) {
    return null;
  }
  return entry.value;
}

export function setCachedComplianceDashboard(
  organizationId: string,
  value: ComplianceDashboardData,
): void {
  dashboardCache.set(organizationId, { value, expiresAt: Date.now() + TTL_MS });
}

export function invalidateComplianceCache(organizationId: string): void {
  dashboardCache.delete(organizationId);
}
