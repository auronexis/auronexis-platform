import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPlatformHealthSnapshot } from "@/lib/observability/health";
import {
  checkSlidingWindowRateLimit,
  extractTrustedIpFromHeaders,
  healthIpKey,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/** Public health probe for uptime monitors and status pages. No secrets exposed. */
export async function GET(): Promise<Response> {
  const headerStore = await headers();
  // Prefer trusted Vercel IP; otherwise fall back to forwarded header for probe abuse only.
  const trusted = extractTrustedIpFromHeaders(headerStore);
  const clientIp =
    trusted ??
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  // FAIL OPEN on Redis backend failure — health probes must not cascade into 503 from limiter outages.
  const rate = await checkSlidingWindowRateLimit({
    key: healthIpKey(clientIp),
    limit: 120,
    windowMs: 60_000,
    failurePolicy: "fail_open",
    bucketClass: "health.ip",
  });

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  const snapshot = await getPlatformHealthSnapshot();

  return NextResponse.json(snapshot, {
    status: snapshot.status === "unavailable" ? 503 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}