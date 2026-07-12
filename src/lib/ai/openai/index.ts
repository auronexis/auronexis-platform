import "server-only";

import { getOpenAIPlatformConfig } from "@/lib/ai/openai/config";
import { runOpenAIConnectionProbe } from "@/lib/ai/openai/responses";
import {
  getLatestFailedOpenAIHealthCheck,
  getLatestSuccessfulOpenAIHealthCheck,
  recordOpenAIHealthCheck,
} from "@/lib/ai/openai/health";
import { recordOpenAIRequestLog } from "@/lib/ai/openai/request-log";
import {
  getOpenAIPlatformStatus,
  mapOpenAIStateToIntegrationLabel,
} from "@/lib/ai/openai/status";
import type { OpenAIConnectionTestResult } from "@/lib/ai/openai/types";

export {
  getOpenAIPlatformConfig,
  withHealthState,
} from "@/lib/ai/openai/config";
export { getOpenAIClient, resetOpenAIClientForTests } from "@/lib/ai/openai/client";
export { classifyOpenAIError, isRetryableOpenAIError } from "@/lib/ai/openai/errors";
export { runOpenAIResponse, runOpenAIConnectionProbe, runOpenAIStructuredResponse } from "@/lib/ai/openai/responses";
export {
  getLatestOpenAIHealthCheck,
  getLatestSuccessfulOpenAIHealthCheck,
  getLatestFailedOpenAIHealthCheck,
  recordOpenAIHealthCheck,
} from "@/lib/ai/openai/health";
export {
  recordOpenAIRequestLog,
  countRecentOpenAIRequests,
  getLatestOpenAIRequestForOrg,
  hasActiveReportGeneration,
} from "@/lib/ai/openai/request-log";
export {
  getOpenAIPlatformStatus,
  mapOpenAIStateToPublicDetail,
  mapOpenAIStateToIntegrationLabel,
} from "@/lib/ai/openai/status";
export { checkOpenAIGenerationLimits } from "@/lib/ai/openai/rate-limit";
export type {
  OpenAIPlatformState,
  OpenAIPlatformConfig,
  OpenAIConnectionTestResult,
  OpenAIErrorCode,
} from "@/lib/ai/openai/types";

export async function runOpenAIConnectionTest(input: {
  organizationId: string;
  userId: string;
}): Promise<OpenAIConnectionTestResult> {
  const config = getOpenAIPlatformConfig();
  const checkedAt = new Date().toISOString();

  if (!config.enabled) {
    return {
      ok: false,
      state: "disabled",
      message: "AI is disabled.",
      model: null,
      latencyMs: null,
      providerRequestId: null,
      errorCode: "disabled",
      checkedAt,
    };
  }

  if (config.state === "not_configured") {
    return {
      ok: false,
      state: "not_configured",
      message: "OpenAI is not configured.",
      model: null,
      latencyMs: null,
      providerRequestId: null,
      errorCode: "not_configured",
      checkedAt,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const result = await runOpenAIConnectionProbe(controller.signal);
  clearTimeout(timeout);

  if (result.ok) {
    await recordOpenAIHealthCheck({
      ok: true,
      model: result.model,
      latencyMs: result.latencyMs,
      providerRequestId: result.providerRequestId,
      errorCode: null,
      sanitizedMessage: null,
    });
    await recordOpenAIRequestLog({
      organizationId: input.organizationId,
      userId: input.userId,
      model: result.model,
      feature: "connection_test",
      status: "succeeded",
      promptVersion: "connection-v1",
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      totalTokens: result.totalTokens,
      latencyMs: result.latencyMs,
      providerRequestId: result.providerRequestId,
    });

    return {
      ok: true,
      state: "connected",
      message: "OpenAI connection verified.",
      model: result.model,
      latencyMs: result.latencyMs,
      providerRequestId: result.providerRequestId,
      errorCode: null,
      checkedAt,
    };
  }

  await recordOpenAIHealthCheck({
    ok: false,
    model: config.model,
    latencyMs: result.latencyMs,
    providerRequestId: result.providerRequestId,
    errorCode: result.errorCode,
    sanitizedMessage: result.sanitizedMessage,
  });
  await recordOpenAIRequestLog({
    organizationId: input.organizationId,
    userId: input.userId,
    model: config.model,
    feature: "connection_test",
    status: "failed",
    promptVersion: "connection-v1",
    latencyMs: result.latencyMs,
    providerRequestId: result.providerRequestId,
    errorCode: result.errorCode,
  });

  const status = await getOpenAIPlatformStatus(true);
  return {
    ok: false,
    state: status.state,
    message: result.sanitizedMessage,
    model: config.model,
    latencyMs: result.latencyMs,
    providerRequestId: result.providerRequestId,
    errorCode: result.errorCode,
    checkedAt,
  };
}

export async function getOpenAIIntegrationSnapshot(organizationId: string) {
  const [status, latestSuccess, latestFailure, latestRequest] = await Promise.all([
    getOpenAIPlatformStatus(),
    getLatestSuccessfulOpenAIHealthCheck(),
    getLatestFailedOpenAIHealthCheck(),
    import("@/lib/ai/openai/request-log").then((m) =>
      m.getLatestOpenAIRequestForOrg(organizationId),
    ),
  ]);

  return {
    connectionStatus: mapOpenAIStateToIntegrationLabel(status.state),
    state: status.state,
    provider: "OpenAI",
    currentModel: status.model,
    lastSuccessfulCheck: latestSuccess?.createdAt ?? null,
    lastFailedCheck: latestFailure?.createdAt ?? null,
    lastLatencyMs: status.lastLatencyMs,
    sanitizedError: status.sanitizedError,
    usageSummary: latestRequest
      ? `Last request ${latestRequest.status}`
      : null,
  };
}
