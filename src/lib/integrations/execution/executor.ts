import "server-only";

import type { HttpAuthConfig } from "@/lib/integrations/http";
import { buildDefaultRequestPreview } from "@/lib/integrations/http";
import {
  executeHttpRequest,
  sanitizeRequestForLog,
  type HttpClientAuth,
  type HttpClientRequest,
} from "@/lib/integrations/execution/http-client";
import { buildIntegrationAuditEvent, formatAuditSummary } from "@/lib/integrations/execution/audit";
import { createDeliveryLog, updateDeliveryLog } from "@/lib/integrations/execution/logging";
import { parseProviderResponse } from "@/lib/integrations/execution/responses";
import { checkIntegrationRateLimit } from "@/lib/integrations/execution/rate-limit";
import {
  computeNextRetryAt,
  getRetryPolicy,
  isDeadLetter,
} from "@/lib/integrations/execution/retry";
import { decrementQueueSize, incrementQueueSize } from "@/lib/integrations/execution/queue";
import {
  getDecryptedSecretValue,
  markSecretUsed,
  validateSecretAccess,
} from "@/lib/integrations/secrets/repository";
import { extractSecretIdFromConfig } from "@/lib/integrations/secrets/references";
import type {
  IntegrationExecuteInput,
  IntegrationExecutionResult,
  IntegrationProvider,
  IntegrationSimulationResult,
} from "@/lib/integrations/types";

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function simulationToExecutionResult(
  simulation: IntegrationSimulationResult,
  input: IntegrationExecuteInput,
): IntegrationExecutionResult {
  const hasErrors = simulation.validationErrors.length > 0;
  return {
    providerId: simulation.providerId,
    providerName: simulation.providerName,
    deliveryStatus: hasErrors ? "failed" : "delivered",
    success: !hasErrors,
    simulated: true,
    durationMs: simulation.durationMs,
    message: simulation.message,
    retryCount: 0,
    validationErrors: simulation.validationErrors,
    secretReferenceStatus: simulation.secretReferenceStatus,
  };
}

function resolveHttpAuth(
  auth: HttpAuthConfig | undefined,
  secretValue: string | null,
): HttpClientAuth {
  if (!secretValue) {
    return { type: "none" };
  }

  if (isUrl(secretValue)) {
    return { type: "none" };
  }

  const authType = auth?.type ?? "bearer";

  switch (authType) {
    case "bearer":
      return { type: "bearer", token: secretValue };
    case "basic":
      return { type: "basic", username: "user", password: secretValue };
    case "api_key":
      return {
        type: "api_key",
        header: auth?.apiKeyHeader ?? "X-API-Key",
        value: secretValue,
      };
    case "none":
      return { type: "webhook", secret: secretValue };
    default:
      return { type: "bearer", token: secretValue };
  }
}

function buildLiveRequest(
  provider: IntegrationProvider,
  input: IntegrationExecuteInput,
  secretValue: string | null,
): HttpClientRequest {
  const config = (input.config ?? {}) as Record<string, unknown>;
  const preview = buildDefaultRequestPreview({
    method: config.method as import("@/lib/integrations/types").HttpMethod | undefined,
    url: config.url as string | undefined,
    headers: config.headers as Record<string, string> | undefined,
    body: config.body ?? config.payload ?? buildDefaultBody(provider.id, config),
    auth: config.auth as HttpAuthConfig | undefined,
    timeoutMs: config.timeoutMs as number | undefined,
    templateContext: input.templateContext,
  });

  let url = preview.url;
  if (secretValue && isUrl(secretValue)) {
    url = secretValue;
  } else if (!url || url.includes("simulated") || url.includes("example.com")) {
    if (secretValue && isUrl(secretValue)) {
      url = secretValue;
    }
  }

  const auth = resolveHttpAuth(config.auth as HttpAuthConfig | undefined, secretValue);

  return {
    method: preview.method,
    url,
    headers: preview.headers,
    body: preview.body,
    auth: auth.type === "none" && secretValue && !isUrl(secretValue)
      ? { type: "webhook", secret: secretValue }
      : auth,
    timeoutMs: preview.timeoutMs,
    maxAttempts: 1,
  };
}

function buildDefaultBody(
  providerId: IntegrationProvider["id"],
  config: Record<string, unknown>,
): unknown {
  switch (providerId) {
    case "slack":
      return {
        text:
          (config.text as string | undefined) ??
          (config.message as string | undefined) ??
          "Notification from Auroranexis workflow.",
      };
    case "microsoft_teams":
      return {
        text:
          (config.text as string | undefined) ??
          (config.message as string | undefined) ??
          "Notification from Auroranexis workflow.",
      };
    case "discord":
      return {
        content:
          (config.content as string | undefined) ??
          (config.message as string | undefined) ??
          "Notification from Auroranexis workflow.",
      };
    default:
      return { message: "Notification from Auroranexis workflow." };
  }
}

export async function executeLiveIntegration(
  provider: IntegrationProvider,
  input: IntegrationExecuteInput,
): Promise<IntegrationExecutionResult> {
  const started = Date.now();

  if (input.forceSimulation) {
    const simulation = provider.simulate(input);
    return simulationToExecutionResult(simulation, input);
  }

  if (!provider.liveExecutionSupported) {
    const simulation = provider.simulate(input);
    return {
      ...simulationToExecutionResult(simulation, input),
      message: `[Placeholder] ${simulation.message} Live execution is not enabled for ${provider.name}.`,
    };
  }

  const validation = provider.validate(input.config);
  const secretId = input.secretId ?? extractSecretIdFromConfig(input.config);
  const validationErrors = [...validation.errors];

  if (!secretId) {
    validationErrors.push({
      field: "secretId",
      message: "Integration action requires a secretId reference.",
    });
  }

  let secretReferenceStatus: IntegrationExecutionResult["secretReferenceStatus"] = "not_required";
  if (!secretId) {
    secretReferenceStatus = "missing";
  } else {
    const accessible = await validateSecretAccess(input.organizationId, secretId);
    secretReferenceStatus = accessible ? "present" : "missing";
    if (!accessible) {
      validationErrors.push({
        field: "secretId",
        message: "Secret reference is missing or inactive in the vault.",
      });
    }
  }

  if (validationErrors.length > 0 || !secretId) {
    return {
      providerId: provider.id,
      providerName: provider.name,
      deliveryStatus: "failed",
      success: false,
      simulated: false,
      durationMs: Date.now() - started,
      message: "Integration not fully configured — execution blocked.",
      retryCount: 0,
      validationErrors,
      secretReferenceStatus,
      failureReason: validationErrors.map((error) => error.message).join("; "),
    };
  }

  const rateLimit = checkIntegrationRateLimit(input.organizationId, provider.id);
  if (!rateLimit.allowed) {
    const logId = await createDeliveryLog({
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      workflowExecutionId: input.workflowExecutionId,
      actionId: input.actionId,
      providerId: provider.id,
      status: "rate_limited",
      failureReason: `Rate limit exceeded (${rateLimit.limit}/min). Retry after ${Math.ceil(rateLimit.retryAfterMs / 1000)}s.`,
    });

    return {
      providerId: provider.id,
      providerName: provider.name,
      deliveryStatus: "rate_limited",
      success: false,
      simulated: false,
      durationMs: Date.now() - started,
      message: "Integration rate limited — delivery deferred.",
      retryCount: 0,
      validationErrors: [],
      secretReferenceStatus,
      logId,
      failureReason: "rate_limited",
    };
  }

  incrementQueueSize();
  let logId: string | undefined;
  let secretValue: string | null = null;

  try {
    secretValue = await getDecryptedSecretValue(input.organizationId, secretId);
    if (!secretValue) {
      return {
        providerId: provider.id,
        providerName: provider.name,
        deliveryStatus: "failed",
        success: false,
        simulated: false,
        durationMs: Date.now() - started,
        message: "Failed to resolve secret from vault.",
        retryCount: 0,
        validationErrors: [
          { field: "secretId", message: "Secret could not be decrypted or is inactive." },
        ],
        secretReferenceStatus: "missing",
        failureReason: "secret_resolution_failed",
      };
    }

    const request = buildLiveRequest(provider, input, secretValue);
    const retryPolicy = getRetryPolicy(provider.id);

    logId = await createDeliveryLog({
      organizationId: input.organizationId,
      workflowId: input.workflowId,
      workflowExecutionId: input.workflowExecutionId,
      actionId: input.actionId,
      providerId: provider.id,
      status: "queued",
      maxRetries: retryPolicy.maxRetries,
      requestMethod: request.method,
      requestUrl: request.url,
      metadata: { request: sanitizeRequestForLog(request) },
    });

    await updateDeliveryLog({
      logId,
      organizationId: input.organizationId,
      status: "sending",
    });

    const response = await executeHttpRequest(request);
    const parsed = parseProviderResponse(provider.id, response);

    if (response.ok) {
      await markSecretUsed(secretId, input.organizationId);
      await updateDeliveryLog({
        logId,
        organizationId: input.organizationId,
        status: "delivered",
        responseCode: response.status,
        latencyMs: response.latencyMs,
        providerMessageId: parsed.providerMessageId ?? null,
      });

      const audit = buildIntegrationAuditEvent({
        providerId: provider.id,
        status: "delivered",
        workflowId: input.workflowId,
        workflowExecutionId: input.workflowExecutionId,
        actionId: input.actionId,
        responseCode: response.status,
        latencyMs: response.latencyMs,
        deliveryId: logId,
        message: `${provider.name} delivered successfully.`,
      });

      return {
        providerId: provider.id,
        providerName: provider.name,
        deliveryStatus: "delivered",
        success: true,
        simulated: false,
        durationMs: Date.now() - started,
        message: formatAuditSummary(audit),
        responseCode: response.status,
        latencyMs: response.latencyMs,
        retryCount: 0,
        deliveryId: logId,
        providerMessageId: parsed.providerMessageId,
        validationErrors: [],
        secretReferenceStatus,
        logId,
      };
    }

    const failureReason =
      parsed.failureReason ?? `HTTP ${response.status}: ${response.statusText}`;
    const retryCount = 1;
    const dead = isDeadLetter(retryCount, provider.id);
    const nextRetryAt = dead ? null : computeNextRetryAt(retryCount, provider.id);

    await updateDeliveryLog({
      logId,
      organizationId: input.organizationId,
      status: dead ? "dead_letter" : "retrying",
      retryCount,
      lastRetryAt: new Date().toISOString(),
      nextRetryAt: nextRetryAt?.toISOString() ?? null,
      failureReason,
      responseCode: response.status,
      latencyMs: response.latencyMs,
    });

    return {
      providerId: provider.id,
      providerName: provider.name,
      deliveryStatus: dead ? "dead_letter" : "retrying",
      success: false,
      simulated: false,
      durationMs: Date.now() - started,
      message: dead
        ? `${provider.name} delivery failed — moved to dead letter.`
        : `${provider.name} delivery failed — retry scheduled.`,
      responseCode: response.status,
      latencyMs: response.latencyMs,
      retryCount,
      deliveryId: logId,
      validationErrors: [],
      secretReferenceStatus,
      logId,
      failureReason,
    };
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : "Execution failed";
    const retryCount = 1;
    const dead = isDeadLetter(retryCount, provider.id);
    const nextRetryAt = dead ? null : computeNextRetryAt(retryCount, provider.id);

    if (logId) {
      await updateDeliveryLog({
        logId,
        organizationId: input.organizationId,
        status: dead ? "dead_letter" : "failed",
        retryCount,
        lastRetryAt: new Date().toISOString(),
        nextRetryAt: nextRetryAt?.toISOString() ?? null,
        failureReason,
      });
    }

    return {
      providerId: provider.id,
      providerName: provider.name,
      deliveryStatus: dead ? "dead_letter" : "failed",
      success: false,
      simulated: false,
      durationMs: Date.now() - started,
      message: `${provider.name} execution error.`,
      retryCount,
      validationErrors: [],
      secretReferenceStatus,
      logId,
      failureReason,
    };
  } finally {
    secretValue = null;
    decrementQueueSize();
  }
}
