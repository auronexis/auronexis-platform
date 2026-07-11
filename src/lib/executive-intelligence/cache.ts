import type { ExecutiveIntelligenceSnapshot } from "@/lib/executive-intelligence/types";
import { SNAPSHOT_CACHE_TTL_MS, NARRATIVE_CACHE_TTL_MS } from "@/lib/executive-intelligence/constants";

type CacheEntry<T> = { value: T; expiresAt: number };

const snapshotCache = new Map<string, CacheEntry<ExecutiveIntelligenceSnapshot>>();
const narrativeCache = new Map<string, CacheEntry<string>>();

function cacheKey(orgId: string, periodKey: string, suffix = ""): string {
  return `${orgId}:${periodKey}${suffix}`;
}

export function getCachedSnapshot(
  organizationId: string,
  periodKey: string,
): ExecutiveIntelligenceSnapshot | null {
  const entry = snapshotCache.get(cacheKey(organizationId, periodKey));
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.value;
}

export function setCachedSnapshot(
  organizationId: string,
  periodKey: string,
  snapshot: ExecutiveIntelligenceSnapshot,
): void {
  snapshotCache.set(cacheKey(organizationId, periodKey), {
    value: snapshot,
    expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS,
  });
}

export function getCachedNarrative(organizationId: string, periodKey: string): string | null {
  const entry = narrativeCache.get(cacheKey(organizationId, periodKey, ":narrative"));
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.value;
}

export function setCachedNarrative(
  organizationId: string,
  periodKey: string,
  narrative: string,
): void {
  narrativeCache.set(cacheKey(organizationId, periodKey, ":narrative"), {
    value: narrative,
    expiresAt: Date.now() + NARRATIVE_CACHE_TTL_MS,
  });
}

export function clearExecutiveIntelligenceCacheForTests(): void {
  snapshotCache.clear();
  narrativeCache.clear();
}
