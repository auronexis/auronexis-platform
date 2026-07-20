import "server-only";

import { PUBLIC_SITEMAP_ROUTES } from "@/lib/company/company-links";
import { resolveCanonicalBaseUrl } from "@/lib/company/company-seo";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** Server-only IndexNow key — never expose via NEXT_PUBLIC. */
export function getIndexNowKey(): string | null {
  const value = process.env.INDEXNOW_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

/** Absolute public URLs from the sitemap registry (canonical www host). */
export function listIndexNowUrls(): string[] {
  const base = resolveCanonicalBaseUrl().replace(/\/$/, "");
  return PUBLIC_SITEMAP_ROUTES.map((path) => {
    if (path === "/") {
      return `${base}/`;
    }
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  });
}

export type IndexNowSubmitResult =
  | { ok: true; submitted: number; skipped: true; reason: string }
  | { ok: true; submitted: number; status: number }
  | { ok: false; error: string; status?: number };

/**
 * Notify IndexNow (Bing and participating engines) of public URLs.
 * No-op when INDEXNOW_KEY is unset. Batches to IndexNow limits (max 10k).
 */
export async function submitIndexNowUrls(
  urls: string[] = listIndexNowUrls(),
): Promise<IndexNowSubmitResult> {
  const key = getIndexNowKey();
  if (!key) {
    return { ok: true, submitted: 0, skipped: true, reason: "INDEXNOW_KEY not configured" };
  }

  const host = new URL(resolveCanonicalBaseUrl()).host;
  const keyLocation = `https://${host}/.well-known/${key}.txt`;
  const unique = Array.from(new Set(urls)).slice(0, 10_000);

  if (unique.length === 0) {
    return { ok: true, submitted: 0, skipped: true, reason: "No URLs to submit" };
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList: unique,
      }),
    });

    if (!response.ok && response.status !== 202) {
      const body = await response.text().catch(() => "");
      return {
        ok: false,
        error: body || `IndexNow HTTP ${response.status}`,
        status: response.status,
      };
    }

    return { ok: true, submitted: unique.length, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "IndexNow request failed",
    };
  }
}
