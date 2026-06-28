import "server-only";

import { sanitizeLogPayload } from "@/lib/integrations/secrets/masking";
import type { IntegrationDeliveryStatus, IntegrationProviderId } from "@/lib/integrations/types";

export type IntegrationAuditEvent = {
  providerId: IntegrationProviderId;
  status: IntegrationDeliveryStatus;
  workflowId?: string;
  workflowExecutionId?: string;
  actionId?: string;
  responseCode?: number;
  latencyMs?: number;
  retryCount: number;
  deliveryId?: string;
  simulated: boolean;
  message: string;
};

export function buildIntegrationAuditEvent(input: {
  providerId: IntegrationProviderId;
  status: IntegrationDeliveryStatus;
  workflowId?: string;
  workflowExecutionId?: string;
  actionId?: string;
  responseCode?: number;
  latencyMs?: number;
  retryCount?: number;
  deliveryId?: string;
  simulated?: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}): IntegrationAuditEvent & { metadata: Record<string, unknown> } {
  return {
    providerId: input.providerId,
    status: input.status,
    workflowId: input.workflowId,
    workflowExecutionId: input.workflowExecutionId,
    actionId: input.actionId,
    responseCode: input.responseCode,
    latencyMs: input.latencyMs,
    retryCount: input.retryCount ?? 0,
    deliveryId: input.deliveryId,
    simulated: Boolean(input.simulated),
    message: input.message,
    metadata: sanitizeLogPayload(input.metadata ?? {}) as Record<string, unknown>,
  };
}

export function formatAuditSummary(event: IntegrationAuditEvent): string {
  const parts = [
    `[${event.providerId}]`,
    event.status,
    event.simulated ? "(simulated)" : "(live)",
    event.responseCode != null ? `HTTP ${event.responseCode}` : null,
    event.latencyMs != null ? `${event.latencyMs}ms` : null,
    event.retryCount > 0 ? `retries=${event.retryCount}` : null,
    event.message,
  ].filter(Boolean);

  return parts.join(" ");
}
