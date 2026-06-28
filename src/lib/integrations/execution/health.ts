import "server-only";

import { getPendingQueueSize } from "@/lib/integrations/execution/queue";
import {
  countDeliveryLogsByStatus,
  getAverageLatencyToday,
} from "@/lib/integrations/execution/logging";
import { listIntegrationProviders } from "@/lib/integrations/registry";
import { bootstrapIntegrationProviders } from "@/lib/integrations/providers";
import type {
  IntegrationRuntimeDashboardSummary,
  IntegrationRuntimeDiagnosticsSnapshot,
} from "@/lib/integrations/types";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function getIntegrationRuntimeDiagnostics(
  organizationId: string,
): Promise<IntegrationRuntimeDiagnosticsSnapshot> {
  bootstrapIntegrationProviders();
  const today = startOfToday();
  const activeProviders = listIntegrationProviders().filter((provider) => provider.liveExecutionSupported)
    .length;

  const [
    successfulToday,
    failedToday,
    retryingCount,
    deadLetterCount,
    rateLimitedToday,
    averageLatencyMs,
    queueSize,
  ] = await Promise.all([
    countDeliveryLogsByStatus(organizationId, "delivered", today),
    countDeliveryLogsByStatus(organizationId, "failed", today),
    countDeliveryLogsByStatus(organizationId, "retrying"),
    countDeliveryLogsByStatus(organizationId, "dead_letter"),
    countDeliveryLogsByStatus(organizationId, "rate_limited", today),
    getAverageLatencyToday(organizationId),
    getPendingQueueSize(organizationId),
  ]);

  return {
    activeProviders,
    successfulToday,
    failedToday,
    retryingCount,
    deadLetterCount,
    averageLatencyMs,
    rateLimitedToday,
    queueSize,
  };
}

export async function getIntegrationRuntimeDashboardSummary(
  organizationId: string,
): Promise<IntegrationRuntimeDashboardSummary> {
  const today = startOfToday();

  const [running, failed, retrying, deliveredToday, averageLatencyMs] = await Promise.all([
    countDeliveryLogsByStatus(organizationId, "sending"),
    countDeliveryLogsByStatus(organizationId, "failed", today),
    countDeliveryLogsByStatus(organizationId, "retrying"),
    countDeliveryLogsByStatus(organizationId, "delivered", today),
    getAverageLatencyToday(organizationId),
  ]);

  return {
    running,
    failed,
    retrying,
    deliveredToday,
    averageLatencyMs,
  };
}
