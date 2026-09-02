import "server-only";

import { resolveCanonicalBaseUrl } from "@/lib/company/company-seo";
import { listPublicIndexableRoutes } from "@/lib/seo/sitemap";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/** Server-only IndexNow key — never expose via NEXT_PUBLIC. */
export function getIndexNowKey(): string | null {
  const value = process.env.INDEXNOW_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

/** Canonical IndexNow host (www only). */
export function getIndexNowHost(): string {
  return new URL(resolveCanonicalBaseUrl()).host;
}

/**
 * Ownership key URL — must be host-root (Option 1).
 * A key under /.well-known/ only authorizes URLs under that path prefix (422 otherwise).
 */
export function buildIndexNowKeyLocation(host: string, key: string): string {
  return `https://${host}/${key}.txt`;
}

/** Absolute public URLs aligned with sitemap indexability filters (canonical www host). */
export function listIndexNowUrls(): string[] {
  const base = resolveCanonicalBaseUrl().replace(/\/$/, "");
  return listPublicIndexableRoutes().map((path) => {
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

export type IndexNowCronRunResult = {
  status: "completed" | "failed" | "skipped";
  reason?: string;
  result?: IndexNowSubmitResult;
};

/**
 * Daily UTC window matching former vercel.json schedule `0 6 * * *`.
 * `/api/cron/run` fires every 5 minutes, so minutes 0–4 at hour 6 run once per day.
 */
export function isIndexNowDailyCronWindow(now: Date = new Date()): boolean {
  return now.getUTCHours() === 6 && now.getUTCMinutes() < 5;
}

/** Invoke IndexNow from the authenticated cron dispatcher when due. */
export async function runIndexNowForCron(
  now: Date = new Date(),
): Promise<IndexNowCronRunResult> {
  if (!isIndexNowDailyCronWindow(now)) {
    return { status: "skipped", reason: "outside_daily_window" };
  }

  const result = await submitIndexNowUrls();
  if (!result.ok) {
    return { status: "failed", result };
  }
  return { status: "completed", result };
}

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

  const host = getIndexNowHost();
  const keyLocation = buildIndexNowKeyLocation(host, key);
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
