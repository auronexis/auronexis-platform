import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { checkDatabaseHealth } from "@/lib/diagnostics/platform-health";
import { getCronSecret } from "@/lib/env";
import { getCronDiagnosticsSnapshot } from "@/lib/jobs/health";
import { getQueueDiagnosticsSnapshot } from "@/lib/queue/health";
import { checkSlidingWindowRateLimit } from "@/lib/security/rate-limit";
import { getStripeWebhookDiagnostics } from "@/lib/stripe/idempotency";

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

  const started = Date.now();

  const [database, stripeWebhook, cron, queue] = await Promise.all([
    checkDatabaseHealth(),
    getStripeWebhookDiagnostics(),
    getCronDiagnosticsSnapshot(),
    getQueueDiagnosticsSnapshot(),
  ]);

  const checks = {
    database: database.level !== "unavailable",
    databaseLevel: database.level,
    stripeWebhooks: stripeWebhook.tableReachable,
    cron: cron.tableReachable && cron.status !== "unavailable",
    queue: queue.tableReachable && queue.status !== "unavailable",
    cronSecretConfigured: Boolean(getCronSecret()),
  };

  const optionalHealthy =
    checks.stripeWebhooks && checks.cron && checks.queue && checks.cronSecretConfigured;

  const status =
    database.level === "unavailable"
      ? "unavailable"
      : optionalHealthy && database.level === "healthy"
        ? "healthy"
        : "degraded";

  return NextResponse.json(
    {
      status,
      version: process.env.npm_package_version ?? "0.1.0",
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      latencyMs: Date.now() - started,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: database.level === "unavailable" ? 503 : 200 },
  );
}
