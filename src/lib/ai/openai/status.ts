import "server-only";

import { getOpenAIPlatformConfig, withHealthState } from "@/lib/ai/openai/config";
import {
  getLatestFailedOpenAIHealthCheck,
  getLatestOpenAIHealthCheck,
  getLatestSuccessfulOpenAIHealthCheck,
} from "@/lib/ai/openai/health";
import type { OpenAIPlatformState } from "@/lib/ai/openai/types";

const HEALTH_TTL_MS = 24 * 60 * 60 * 1000;

export type OpenAIPlatformStatus = {
  state: OpenAIPlatformState;
  model: string | null;
  lastSuccessfulCheck: string | null;
  lastFailedCheck: string | null;
  lastLatencyMs: number | null;
  sanitizedError: string | null;
  usageRecorded: boolean;
};

function isRecent(timestamp: string | null): boolean {
  if (!timestamp) return false;
  return Date.now() - new Date(timestamp).getTime() <= HEALTH_TTL_MS;
}

export async function getOpenAIPlatformStatus(
  usageRecorded = false,
): Promise<OpenAIPlatformStatus> {
  const base = getOpenAIPlatformConfig();
  const [latest, latestSuccess, latestFailure] = await Promise.all([
    getLatestOpenAIHealthCheck(),
    getLatestSuccessfulOpenAIHealthCheck(),
    getLatestFailedOpenAIHealthCheck(),
  ]);

  const recentSuccess = isRecent(latestSuccess?.createdAt ?? null);
  const recentFailure = isRecent(latestFailure?.createdAt ?? null);
  const recentLatest = isRecent(latest?.createdAt ?? null);

  let state = base.state;
  if (base.state === "configured" || base.state === "connected" || base.state === "degraded") {
    if (recentSuccess && (!recentFailure || (latestSuccess && latestFailure &&
      latestSuccess.createdAt >= latestFailure.createdAt))) {
      state = "connected";
    } else if (recentFailure && recentLatest && latest && !latest.ok) {
      state = "degraded";
    } else if (base.apiKey) {
      state = "configured";
    }
  }

  const resolved = withHealthState(base, latest ? { ok: latest.ok } : null);

  return {
    state,
    model: resolved.apiKey ? resolved.model : null,
    lastSuccessfulCheck: latestSuccess?.createdAt ?? null,
    lastFailedCheck: latestFailure?.createdAt ?? null,
    lastLatencyMs: latestSuccess?.latencyMs ?? latest?.latencyMs ?? null,
    sanitizedError: latestFailure?.sanitizedMessage ?? null,
    usageRecorded,
  };
}

export function mapOpenAIStateToPublicDetail(state: OpenAIPlatformState): {
  status: "operational" | "degraded" | "maintenance";
  detail: string;
} {
  switch (state) {
    case "disabled":
      return { status: "maintenance", detail: "Disabled" };
    case "not_configured":
      return { status: "maintenance", detail: "Not configured" };
    case "connected":
      return { status: "operational", detail: "Operational" };
    case "degraded":
      return { status: "degraded", detail: "Degraded" };
    case "configured":
    default:
      return { status: "maintenance", detail: "Unknown" };
  }
}

export function mapOpenAIStateToIntegrationLabel(state: OpenAIPlatformState): string {
  switch (state) {
    case "connected":
      return "Connected";
    case "degraded":
      return "Degraded";
    case "disabled":
      return "Disabled";
    case "not_configured":
      return "Not configured";
    case "configured":
    default:
      return "Configured";
  }
}
