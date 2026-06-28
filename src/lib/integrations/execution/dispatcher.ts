import "server-only";

import type { WorkflowAction } from "@/lib/automation/builder/types";
import { executeLiveIntegration } from "@/lib/integrations/execution/executor";
import { getIntegrationProvider } from "@/lib/integrations/registry";
import { bootstrapIntegrationProviders } from "@/lib/integrations/providers";
import { extractSecretReferences } from "@/lib/integrations/templates";
import { extractSecretIdFromConfig } from "@/lib/integrations/secrets/references";
import type { IntegrationExecutionResult } from "@/lib/integrations/types";
import {
  getProviderIdForAction,
  isIntegrationActionType,
  simulateWorkflowIntegrationAction,
} from "@/lib/integrations/simulation";

export type DispatchWorkflowIntegrationInput = {
  action: WorkflowAction;
  organizationId: string;
  templateContext?: Record<string, unknown>;
  workflowId?: string;
  workflowExecutionId?: string;
  forceSimulation?: boolean;
};

export function formatExecutionSummary(result: IntegrationExecutionResult): string {
  const parts = [
    result.simulated ? "[Simulation]" : "[Live]",
    result.message,
    result.responseCode != null ? `HTTP ${result.responseCode}` : null,
    result.latencyMs != null ? `${result.latencyMs}ms` : `${result.durationMs}ms`,
    `status=${result.deliveryStatus}`,
    result.retryCount > 0 ? `retries=${result.retryCount}` : null,
    result.providerMessageId ? `msg=${result.providerMessageId}` : null,
  ].filter(Boolean);

  if (result.validationErrors.length > 0) {
    parts.push(
      `Validation: ${result.validationErrors.map((error) => error.message).join("; ")}`,
    );
  }

  return parts.join(" ");
}

export async function dispatchWorkflowIntegrationAction(
  input: DispatchWorkflowIntegrationInput,
): Promise<IntegrationExecutionResult> {
  const { action, organizationId, templateContext = {}, forceSimulation } = input;

  if (!isIntegrationActionType(action.type)) {
    throw new Error(`Action type ${action.type} is not an integration action.`);
  }

  if (forceSimulation) {
    const simulation = await simulateWorkflowIntegrationAction(
      action,
      organizationId,
      templateContext,
    );
    return {
      providerId: simulation.providerId,
      providerName: simulation.providerName,
      deliveryStatus:
        simulation.validationErrors.length > 0 ? "failed" : "delivered",
      success: simulation.validationErrors.length === 0,
      simulated: true,
      durationMs: simulation.durationMs,
      message: simulation.message,
      retryCount: 0,
      validationErrors: simulation.validationErrors,
      secretReferenceStatus: simulation.secretReferenceStatus,
    };
  }

  bootstrapIntegrationProviders();
  const providerId = getProviderIdForAction(action.type);
  const provider = getIntegrationProvider(providerId);

  if (!provider) {
    return {
      providerId,
      providerName: providerId,
      deliveryStatus: "failed",
      success: false,
      simulated: false,
      durationMs: 0,
      message: `Provider ${providerId} is not registered.`,
      retryCount: 0,
      validationErrors: [
        { field: "provider", message: `Provider ${providerId} is not registered.` },
      ],
      secretReferenceStatus: "not_required",
      failureReason: "provider_not_registered",
    };
  }

  const secretId = extractSecretIdFromConfig(action.config);

  return executeLiveIntegration(provider, {
    organizationId,
    config: action.config as Record<string, unknown> | undefined,
    templateContext,
    secretReferences: extractSecretReferences(action.config),
    secretId,
    workflowId: input.workflowId,
    workflowExecutionId: input.workflowExecutionId,
    actionId: action.id,
    forceSimulation: false,
  });
}
