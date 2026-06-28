import type { ResolvedWhiteLabelBranding } from "@/lib/white-label/types";

type CacheEntry = {
  branding: ResolvedWhiteLabelBranding;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = 60_000;

function cacheKey(organizationId: string, publishedOnly: boolean): string {
  return `${organizationId}:${publishedOnly ? "published" : "draft"}`;
}

export function getCachedWhiteLabelBranding(
  organizationId: string,
  publishedOnly: boolean,
): ResolvedWhiteLabelBranding | null {
  const entry = cache.get(cacheKey(organizationId, publishedOnly));
  if (!entry) {
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(cacheKey(organizationId, publishedOnly));
    return null;
  }
  return entry.branding;
}

export function setCachedWhiteLabelBranding(
  organizationId: string,
  branding: ResolvedWhiteLabelBranding,
  publishedOnly: boolean,
): void {
  cache.set(cacheKey(organizationId, publishedOnly), {
    branding,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function invalidateWhiteLabelCache(organizationId: string): void {
  cache.delete(cacheKey(organizationId, true));
  cache.delete(cacheKey(organizationId, false));
}

export function getWhiteLabelCacheSize(): number {
  return cache.size;
}
