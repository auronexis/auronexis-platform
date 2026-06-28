import "server-only";

import type { WorkflowAction } from "@/lib/automation/builder/types";
import type {
  IntegrationDiagnosticsSnapshot,
  IntegrationProviderId,
  IntegrationSimulateInput,
  IntegrationSimulationResult,
} from "@/lib/integrations/types";
import {
  freezeIntegrationRegistry,
  getIntegrationProvider,
  listIntegrationProviders,
} from "@/lib/integrations/registry";
import { extractSecretReferences } from "@/lib/integrations/templates";
import { redactSecretFields } from "@/lib/integrations/secrets/masking";
import { extractSecretIdFromConfig } from "@/lib/integrations/secrets/references";
import { validateSecretAccess } from "@/lib/integrations/secrets/repository";
import { bootstrapIntegrationProviders } from "@/lib/integrations/providers";

let bootstrapComplete = false;

function ensureBootstrap(): void {
  if (bootstrapComplete) {
    return;
  }

  bootstrapIntegrationProviders();
  freezeIntegrationRegistry();
  bootstrapComplete = true;
}

export const INTEGRATION_ACTION_TYPES = [
  "send_slack_message",
  "send_teams_message",
  "post_webhook",
  "rest_api_call",
  "send_email",
  "create_jira_issue",
  "create_github_issue",
  "create_notion_page",
  "create_linear_ticket",
  "create_azure_devops_work_item",
  "send_discord_notification",
  "send_google_chat_message",
] as const;

export type IntegrationWorkflowActionType = (typeof INTEGRATION_ACTION_TYPES)[number];

const ACTION_TO_PROVIDER: Record<IntegrationWorkflowActionType, IntegrationProviderId> = {
  send_slack_message: "slack",
  send_teams_message: "microsoft_teams",
  post_webhook: "webhook",
  rest_api_call: "rest_api",
  send_email: "email",
  create_jira_issue: "jira",
  create_github_issue: "github",
  create_notion_page: "notion",
  create_linear_ticket: "linear",
  create_azure_devops_work_item: "azure_devops",
  send_discord_notification: "discord",
  send_google_chat_message: "google_chat",
};

export function isIntegrationActionType(actionType: string): actionType is IntegrationWorkflowActionType {
  return (INTEGRATION_ACTION_TYPES as readonly string[]).includes(actionType);
}

export function getProviderIdForAction(actionType: IntegrationWorkflowActionType): IntegrationProviderId {
  return ACTION_TO_PROVIDER[actionType];
}

export function simulateIntegration(
  providerId: IntegrationProviderId,
  input: IntegrationSimulateInput = {},
): IntegrationSimulationResult {
  ensureBootstrap();
  const provider = getIntegrationProvider(providerId);

  if (!provider) {
    return {
      providerId,
      providerName: providerId,
      simulated: true,
      requestPreview: {
        method: "POST",
        url: "https://example.com/unregistered",
        headers: {},
        timeoutMs: 30_000,
        retryCount: 0,
      },
      validationErrors: [{ field: "provider", message: `Provider ${providerId} is not registered.` }],
      durationMs: 0,
      secretReferenceStatus: "not_required",
      message: "Provider not registered.",
    };
  }

  const sanitizedInput: IntegrationSimulateInput = {
    ...input,
    config: redactSecretFields(input.config) as Record<string, unknown> | undefined,
  };

  const result = provider.simulate(sanitizedInput);
  return {
    ...result,
    secretReferenceStatus: result.secretReferenceStatus ?? "not_required",
  };
}

export async function simulateWorkflowIntegrationAction(
  action: WorkflowAction,
  organizationId: string,
  templateContext: Record<string, unknown> = {},
): Promise<IntegrationSimulationResult> {
  if (!isIntegrationActionType(action.type)) {
    throw new Error(`Action type ${action.type} is not an integration action.`);
  }

  const providerId = getProviderIdForAction(action.type);
  const secretReferences = extractSecretReferences(action.config);
  const secretId = extractSecretIdFromConfig(action.config);
  const validationErrors: IntegrationSimulationResult["validationErrors"] = [];
  let secretReferenceStatus: IntegrationSimulationResult["secretReferenceStatus"] = "not_required";

  if (!secretId) {
    secretReferenceStatus = "missing";
    validationErrors.push({
      field: "secretId",
      message: "Integration action requires a secretId reference.",
    });
  } else {
    const accessible = await validateSecretAccess(organizationId, secretId);
    secretReferenceStatus = accessible ? "present" : "missing";
    if (!accessible) {
      validationErrors.push({
        field: "secretId",
        message: "Secret reference is missing or inactive in the vault.",
      });
    }
  }

  const result = simulateIntegration(providerId, {
    config: redactSecretFields(action.config) as Record<string, unknown> | undefined,
    templateContext,
    secretReferences,
  });

  return {
    ...result,
    secretReferenceStatus,
    validationErrors: [...result.validationErrors, ...validationErrors],
    message: `${result.message} Secret reference: ${secretReferenceStatus}.`,
  };
}

export function getIntegrationsDiagnostics(): IntegrationDiagnosticsSnapshot {
  ensureBootstrap();
  const providers = listIntegrationProviders();
  const snapshots = providers.map((provider) => provider.health());

  return {
    registeredProviderCount: providers.length,
    registeredProviders: snapshots.map((snapshot) => ({
      id: snapshot.providerId,
      name: snapshot.providerName,
      simulationSupported: snapshot.simulationSupported,
      status: snapshot.status,
    })),
    configuredProviderCount: snapshots.filter((snapshot) => snapshot.configured).length,
    readyProviderCount: snapshots.filter((snapshot) => snapshot.status === "configured").length,
    missingSecretCount: snapshots.reduce(
      (count, snapshot) => count + snapshot.missingSecretIds.length,
      0,
    ),
    simulationEnabled: true,
  };
}

export function formatSimulationSummary(result: IntegrationSimulationResult): string {
  const preview = result.requestPreview;
  const errorSummary =
    result.validationErrors.length > 0
      ? ` Validation: ${result.validationErrors.map((error) => error.message).join("; ")}.`
      : "";

  return `${result.message} ${preview.method} ${preview.url} (${result.durationMs}ms). Secret: ${result.secretReferenceStatus}.${errorSummary}`;
}
