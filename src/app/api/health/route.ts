import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPlatformHealthSnapshot } from "@/lib/observability/health";
import { checkSlidingWindowRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/** Public health probe for uptime monitors and status pages. No secrets exposed. */
export async function GET(): Promise<Response> {
  const headerStore = await headers();
  const clientIp =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";
  const rate = checkSlidingWindowRateLimit({
    key: `health:${clientIp}`,
    limit: 120,
    windowMs: 60_000,
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
