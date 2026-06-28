import type {
  IntegrationHealthSnapshot,
  IntegrationHealthStatus,
  IntegrationProvider,
} from "@/lib/integrations/types";
import { extractSecretReferences } from "@/lib/integrations/templates";

export function evaluateProviderHealth(
  provider: IntegrationProvider,
  config?: unknown,
  options?: { configuredSecretCount?: number },
): IntegrationHealthSnapshot {
  const validation = provider.validate(config);
  const secretReferences = extractSecretReferences(config);
  const secretIdFromConfig = config && typeof config === "object"
    ? (config as Record<string, unknown>).secretId
    : undefined;
  const missingSecretIds = [
    ...secretReferences.map((reference) => reference.secretId),
    ...(typeof secretIdFromConfig === "string" && secretIdFromConfig.trim() !== ""
      ? [secretIdFromConfig]
      : []),
  ].filter((value, index, array) => array.indexOf(value) === index);

  const configured = isConfigured(config);
  const configuredSecretCount = options?.configuredSecretCount ?? 0;
  const status = resolveHealthStatus({
    configured,
    validationValid: validation.valid,
    missingSecretIds,
    configuredSecretCount,
  });

  return {
    providerId: provider.id,
    providerName: provider.name,
    status,
    simulationSupported: true,
    configured,
    missingSecretIds,
    configuredSecretCount,
    notes: buildHealthNotes(status, provider.name, configuredSecretCount, provider.liveExecutionSupported),
  };
}

function isConfigured(config: unknown): boolean {
  if (!config || typeof config !== "object") {
    return false;
  }

  const record = config as Record<string, unknown>;
  return Object.keys(record).length > 0;
}

function resolveHealthStatus(input: {
  configured: boolean;
  validationValid: boolean;
  missingSecretIds: string[];
  configuredSecretCount: number;
}): IntegrationHealthStatus {
  if (input.configuredSecretCount > 0 && input.missingSecretIds.length === 0) {
    return input.validationValid ? "configured" : "invalid_config";
  }

  if (!input.configured && input.configuredSecretCount === 0) {
    return "simulation_available";
  }

  if (input.missingSecretIds.length > 0 || input.configuredSecretCount === 0) {
    return "missing_credentials";
  }

  if (!input.validationValid) {
    return "invalid_config";
  }

  return "configured";
}

function buildHealthNotes(
  status: IntegrationHealthStatus,
  providerName: string,
  configuredSecretCount: number,
  liveExecutionSupported: boolean,
): string[] {
  switch (status) {
    case "simulation_available":
      return [`${providerName} is registered. Add credentials in the secrets vault to mark as ready.`];
    case "missing_credentials":
      return configuredSecretCount > 0
        ? ["Workflow references a secret that is missing or inactive."]
        : ["No active credentials stored for this provider."];
    case "invalid_config":
      return ["Configuration failed validation. Simulation preview still available."];
    case "configured":
      return liveExecutionSupported
        ? ["Credentials available. Live execution enabled."]
        : ["Credentials available. Live execution pending for this provider."];
    case "disabled":
      return ["Provider disabled."];
    default:
      return [];
  }
}

export function summarizeHealthStatuses(
  snapshots: IntegrationHealthSnapshot[],
): {
  configured: number;
  missingCredentials: number;
  invalidConfig: number;
  simulationAvailable: number;
} {
  return snapshots.reduce(
    (acc, snapshot) => {
      switch (snapshot.status) {
        case "configured":
          acc.configured += 1;
          break;
        case "missing_credentials":
          acc.missingCredentials += 1;
          break;
        case "invalid_config":
          acc.invalidConfig += 1;
          break;
        case "simulation_available":
          acc.simulationAvailable += 1;
          break;
        default:
          break;
      }

      return acc;
    },
    { configured: 0, missingCredentials: 0, invalidConfig: 0, simulationAvailable: 0 },
  );
}
