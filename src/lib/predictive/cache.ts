import "server-only";

import { cache } from "react";
import {
  buildPredictiveDashboardSummary,
  generateClientPredictiveAnalysis,
  generatePredictiveIntelligence,
} from "@/lib/predictive/engine";
import {
  buildClientPredictiveSnapshot,
  buildOrganizationPredictiveSnapshot,
} from "@/lib/predictive/queries";
import type {
  ClientPredictiveAnalysis,
  PredictiveDashboardSummary,
  PredictiveDiagnosticsSnapshot,
  PredictiveIntelligenceResult,
} from "@/lib/predictive/types";
import { PREDICTIVE_ENGINE_VERSION as ENGINE_VERSION } from "@/lib/predictive/types";
import type { SessionContext } from "@/lib/tenancy/context";

type CacheStats = {
  hits: number;
  misses: number;
  lastRefreshDurationMs: number | null;
  lastPredictionLatencyMs: number | null;
  lastGeneratedAt: string | null;
  lastForecastCount: number;
  lastAverageConfidence: number;
};

const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  lastRefreshDurationMs: null,
  lastPredictionLatencyMs: null,
  lastGeneratedAt: null,
  lastForecastCount: 0,
  lastAverageConfidence: 0,
};

const orgResultCache = new Map<string, PredictiveIntelligenceResult>();

function recordStats(result: PredictiveIntelligenceResult, refreshDurationMs: number): void {
  cacheStats.lastRefreshDurationMs = refreshDurationMs;
  cacheStats.lastPredictionLatencyMs = result.durationMs;
  cacheStats.lastGeneratedAt = result.generatedAt;
  cacheStats.lastForecastCount = result.forecastCount;
  cacheStats.lastAverageConfidence = result.overallConfidence.score;
}

export function getPredictiveCacheStats(): CacheStats {
  return { ...cacheStats };
}

export function getPredictiveCacheHitRatio(): number {
  const total = cacheStats.hits + cacheStats.misses;
  if (total === 0) return 0;
  return Math.round((cacheStats.hits / total) * 100);
}

async function computePredictiveIntelligence(
  session: SessionContext,
): Promise<PredictiveIntelligenceResult> {
  cacheStats.misses += 1;
  const started = Date.now();
  const snapshot = await buildOrganizationPredictiveSnapshot(session);
  const result = generatePredictiveIntelligence(snapshot, {
    durationMs: Date.now() - started,
  });
  recordStats(result, Date.now() - started);
  orgResultCache.set(session.organization.id, result);
  return result;
}

export const getPredictiveIntelligence = cache(
  async (session: SessionContext): Promise<PredictiveIntelligenceResult> => {
    const cached = orgResultCache.get(session.organization.id);
    if (cached) {
      cacheStats.hits += 1;
      return cached;
    }
    return computePredictiveIntelligence(session);
  },
);

export const getClientPredictiveAnalysis = cache(
  async (session: SessionContext, clientId: string): Promise<ClientPredictiveAnalysis | null> => {
    const started = Date.now();
    const snapshot = await buildClientPredictiveSnapshot(session, clientId);
    if (!snapshot) return null;
    return generateClientPredictiveAnalysis(snapshot, { durationMs: Date.now() - started });
  },
);

export const getPredictiveDashboardSummary = cache(
  async (session: SessionContext): Promise<PredictiveDashboardSummary> => {
    const result = await getPredictiveIntelligence(session);
    return buildPredictiveDashboardSummary(result);
  },
);

export async function refreshPredictiveIntelligence(
  session: SessionContext,
): Promise<PredictiveIntelligenceResult> {
  orgResultCache.delete(session.organization.id);
  return computePredictiveIntelligence(session);
}

export async function refreshClientPredictiveAnalysis(
  session: SessionContext,
  clientId: string,
): Promise<ClientPredictiveAnalysis | null> {
  const started = Date.now();
  const snapshot = await buildClientPredictiveSnapshot(session, clientId);
  if (!snapshot) return null;
  return generateClientPredictiveAnalysis(snapshot, { durationMs: Date.now() - started });
}

export async function getPredictiveDiagnosticsSnapshot(): Promise<PredictiveDiagnosticsSnapshot> {
  const stats = getPredictiveCacheStats();
  return {
    engineVersion: ENGINE_VERSION,
    forecastCount: stats.lastForecastCount,
    averageConfidence: stats.lastAverageConfidence,
    cacheHitRatio: getPredictiveCacheHitRatio(),
    refreshDurationMs: stats.lastRefreshDurationMs,
    predictionLatencyMs: stats.lastPredictionLatencyMs,
    lastGeneratedAt: stats.lastGeneratedAt,
  };
}
