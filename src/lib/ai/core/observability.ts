import "server-only";

import { cache } from "react";
import { formatAIProviderHealthMessage } from "@/lib/ai/provider-labels";
import { getAIConfig } from "@/lib/ai/server/config";
import { resolveAIProvider } from "@/lib/ai/server/resolve-provider";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";
import { AI_MODULE_VERSIONS } from "@/lib/ai/core/versions";
import type { PlanKey } from "@/lib/billing/plans";
import type { SessionContext } from "@/lib/tenancy/context";

export type AIGenerationMetric = {
  module: string;
  action: string;
  organizationId: string;
  startedAt: string;
  contextBuildMs: number;
  providerLatencyMs: number;
  validationMs: number;
  totalMs: number;
  success: boolean;
  retried: boolean;
  cancelled: boolean;
  timedOut: boolean;
  providerId: string;
  model: string;
};

export type AIDiagnosticsSnapshot = {
  providerEnv: string;
  openaiApiKeyPresent: boolean;
  openaiModel: string;
  resolvedProviderId: string;
  providerHealthOk: boolean;
  providerHealthMessage: string;
  lastLatencyMs: number | null;
  averageLatencyMs: number | null;
  totalCallsThisMonth: number;
  failedCallsEstimate: number;
  retriesEstimate: number;
  timeoutsEstimate: number;
  cancelledEstimate: number;
  cacheEnabled: boolean;
  developmentMode: boolean;
  versions: typeof AI_MODULE_VERSIONS;
  recentMetrics: AIGenerationMetric[];
};

const MAX_METRICS = 50;
const metricsBuffer: AIGenerationMetric[] = [];

/** Record a generation metric — diagnostics only, in-memory. */
export function recordAIGenerationMetric(metric: AIGenerationMetric): void {
  metricsBuffer.unshift(metric);
  if (metricsBuffer.length > MAX_METRICS) {
    metricsBuffer.length = MAX_METRICS;
  }
}

export function getRecentAIGenerationMetrics(organizationId?: string): AIGenerationMetric[] {
  if (!organizationId) return metricsBuffer.slice(0, 10);
  return metricsBuffer.filter((m) => m.organizationId === organizationId).slice(0, 10);
}

export async function checkAIProviderHealth(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
  const started = Date.now();
  const isDevelopment = process.env.NODE_ENV !== "production";

  try {
    const { provider } = resolveAIProvider();
    const message = formatAIProviderHealthMessage(provider.id, { isDevelopment });
    const ok = provider.id !== "placeholder" || isDevelopment;

    return { ok, message, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, message: "Provider resolution failed", latencyMs: Date.now() - started };
  }
}

function estimateFromMetrics(metrics: AIGenerationMetric[]) {
  return {
    failed: metrics.filter((m) => !m.success).length,
    retries: metrics.filter((m) => m.retried).length,
    timeouts: metrics.filter((m) => m.timedOut).length,
    cancelled: metrics.filter((m) => m.cancelled).length,
    averageLatencyMs:
      metrics.length > 0
        ? Math.round(
            metrics.reduce((sum, m) => sum + m.totalMs, 0) / metrics.length,
          )
        : null,
    lastLatencyMs: metrics[0]?.totalMs ?? null,
  };
}

export const getAIDiagnosticsSnapshot = cache(
  async (session: SessionContext, planKey: PlanKey): Promise<AIDiagnosticsSnapshot> => {
    const aiConfig = getAIConfig();
    const { provider } = resolveAIProvider();
    const openaiKeyPresent = Boolean(aiConfig.openaiApiKey);
    const labelOptions = {
      isDevelopment: process.env.NODE_ENV !== "production",
      openaiKeyPresent,
      anthropicKeyPresent: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    };
    const [usageSummary, health] = await Promise.all([
      getAIUsageSummaryForSession(session, planKey),
      checkAIProviderHealth(),
    ]);

    const orgMetrics = getRecentAIGenerationMetrics(session.organization.id);
    const estimates = estimateFromMetrics(orgMetrics);

    return {
      providerEnv: formatAIProviderHealthMessage(provider.id, labelOptions),
      openaiApiKeyPresent: Boolean(aiConfig.openaiApiKey),
      openaiModel: aiConfig.openaiModel,
      resolvedProviderId: provider.id,
      providerHealthOk: health.ok,
      providerHealthMessage: health.message,
      lastLatencyMs: estimates.lastLatencyMs,
      averageLatencyMs: estimates.averageLatencyMs,
      totalCallsThisMonth: usageSummary.callsThisMonth,
      failedCallsEstimate: estimates.failed,
      retriesEstimate: estimates.retries,
      timeoutsEstimate: estimates.timeouts,
      cancelledEstimate: estimates.cancelled,
      cacheEnabled: true,
      developmentMode: process.env.NODE_ENV !== "production",
      versions: AI_MODULE_VERSIONS,
      recentMetrics: orgMetrics,
    };
  },
);

export async function timeAIContextBuild<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const started = Date.now();
  const result = await fn();
  return { result, ms: Date.now() - started };
}
