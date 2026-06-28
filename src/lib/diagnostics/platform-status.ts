import "server-only";

import { checkDatabaseHealth } from "@/lib/diagnostics/platform-health";
import {
  buildHealthProbeOk,
  evaluateServiceStatus,
  getPlatformReadinessStatus,
  type PlatformReadinessStatus,
  type PlatformServiceStatus,
} from "@/lib/diagnostics/platform-readiness";
import { getCronDiagnosticsSnapshot } from "@/lib/jobs/health";
import { getQueueDiagnosticsSnapshot } from "@/lib/queue/health";
import { getStripeWebhookDiagnostics } from "@/lib/stripe/idempotency";
import { getCronSecret } from "@/lib/env";
import { getStripeEnvDiagnostics } from "@/lib/diagnostics/stripe-env";

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
  const [database, stripeWebhook, cron, queue, stripeEnv] = await Promise.all([
    checkDatabaseHealth(),
    getStripeWebhookDiagnostics(),
    getCronDiagnosticsSnapshot(),
    getQueueDiagnosticsSnapshot(),
    Promise.resolve(getStripeEnvDiagnostics()),
  ]);

  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const cronOk = cron.tableReachable && cron.status !== "unavailable";
  const queueOk = queue.tableReachable && queue.status !== "unavailable";
  const cronSecretConfigured = Boolean(getCronSecret());
  const stripeConfigured = stripeEnv.secretKey.present && stripeEnv.webhookSecret.present;
  const sentryConfigured = Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
  const posthogConfigured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

  const readinessInput = {
    environment,
    nodeEnv,
    databaseOk: database.ok,
    authOk: database.ok,
    healthProbeOk: false,
    stripeConfigured,
    stripeWebhookReachable: stripeWebhook.tableReachable,
    cronSecretConfigured,
    cronOk,
    queueOk,
    sentryConfigured,
    posthogConfigured,
    stripeWebhookFailures: stripeWebhook.failedEvents,
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
      key: "stripe",
      label: "Stripe",
      status: evaluateServiceStatus("stripe", readinessInput),
      detail: stripeConfigured
        ? stripeWebhook.tableReachable
          ? "Webhooks + env configured"
          : "Webhook table unreachable"
        : nodeEnv === "development"
          ? "Not configured (optional in development)"
          : "Missing Stripe env",
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
