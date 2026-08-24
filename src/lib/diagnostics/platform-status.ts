import "server-only";

import {
  checkActiveBillingProviderHealth,
  checkDatabaseHealth,
  checkMollieApiConfigHealth,
} from "@/lib/diagnostics/platform-health";
import {
  buildHealthProbeOk,
  evaluateServiceStatus,
  getPlatformReadinessStatus,
  type PlatformReadinessStatus,
  type PlatformServiceStatus,
} from "@/lib/diagnostics/platform-readiness";
import { getCronDiagnosticsSnapshot } from "@/lib/jobs/health";
import { getQueueDiagnosticsSnapshot } from "@/lib/queue/health";
import { getStripeWebhookDiagnostics } from "@/lib/diagnostics/webhook-archive";
import { getCronSecret } from "@/lib/env";

export type PlatformStatusItem = {
  key: string;
  label: string;
  status: PlatformServiceStatus;
  detail: string;
};

export type PlatformStatusSnapshot = {
  readiness: PlatformReadinessStatus;
  environment: string;
  version: string;
  items: PlatformStatusItem[];
  observability: {
    sentryConfigured: boolean;
    posthogConfigured: boolean;
    healthEndpoint: string;
  };
};

/** Aggregated platform status for dashboard widget — owner/admin only. */
export async function getPlatformStatusSnapshot(): Promise<PlatformStatusSnapshot> {
  const [database, legacyWebhookArchive, cron, queue] = await Promise.all([
    checkDatabaseHealth(),
    getStripeWebhookDiagnostics(),
    getCronDiagnosticsSnapshot(),
    getQueueDiagnosticsSnapshot(),
  ]);
  const mollieApi = checkMollieApiConfigHealth();
  const activeBillingProvider = checkActiveBillingProviderHealth();

  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const cronOk = cron.tableReachable && cron.status !== "unavailable";
  const queueOk = queue.tableReachable && queue.status !== "unavailable";
  const cronSecretConfigured = Boolean(getCronSecret());
  /**
   * Legacy field name kept for platform-readiness scoring — reflects Mollie
   * configuration health, not retired Stripe/Paddle/FastSpring runtimes.
   */
  const stripeConfigured = mollieApi.ok;
  const sentryConfigured = Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
  const posthogConfigured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

  const readinessInput = {
    environment,
    nodeEnv,
    databaseOk: database.level !== "unavailable",
    databaseLevel: database.level,
    authOk: database.level !== "unavailable",
    healthProbeOk: false,
    stripeConfigured,
    stripeWebhookReachable: legacyWebhookArchive.tableReachable,
    cronSecretConfigured,
    cronOk,
    queueOk,
    sentryConfigured,
    posthogConfigured,
    stripeWebhookFailures: legacyWebhookArchive.failedEvents,
  };

  readinessInput.healthProbeOk = buildHealthProbeOk(readinessInput);
  const readiness = getPlatformReadinessStatus(readinessInput);

  const items: PlatformStatusItem[] = [
    {
      key: "database",
      label: "Database",
      status: evaluateServiceStatus("database", readinessInput),
      detail: database.message,
    },
    {
      key: "active_billing_provider",
      label: "Active billing provider",
      status: "healthy",
      detail: activeBillingProvider.message,
    },
    {
      key: "mollie_api",
      label: "Mollie API",
      status: mollieApi.ok ? "healthy" : "degraded",
      detail: mollieApi.message,
    },
    {
      key: "legacy_billing_archive",
      label: "Legacy billing archive",
      status: "healthy",
      detail:
        "Historical billing webhook tables retained read-only; never drive active checkout or entitlements",
    },
    {
      key: "cron",
      label: "Cron",
      status: evaluateServiceStatus("cron", readinessInput),
      detail: cronSecretConfigured
        ? `${cron.enabledJobs ?? 0} jobs · ${cron.status}`
        : nodeEnv === "development"
          ? "CRON_SECRET not configured (optional in development)"
          : "CRON_SECRET not configured",
    },
    {
      key: "queue",
      label: "Queue",
      status: evaluateServiceStatus("queue", readinessInput),
      detail: `${queue.jobsPending ?? 0} pending · ${queue.deadLetters ?? 0} dead letter`,
    },
    {
      key: "health",
      label: "Health probe",
      status: evaluateServiceStatus("health", readinessInput),
      detail: "GET /api/health",
    },
    {
      key: "observability",
      label: "Observability",
      status: evaluateServiceStatus("observability", readinessInput),
      detail:
        sentryConfigured || posthogConfigured
          ? "Monitoring configured"
          : nodeEnv === "development"
            ? "Sentry / PostHog not configured"
            : "Monitoring not configured",
    },
  ];

  return {
    readiness,
    environment,
    version: process.env.npm_package_version ?? "0.1.0",
    items,
    observability: {
      sentryConfigured,
      posthogConfigured,
      healthEndpoint: "/api/health",
    },
  };
}

export { getPlatformReadinessStatus };
