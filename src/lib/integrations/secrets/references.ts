import type { IntegrationSecretReference } from "@/lib/integrations/types";

export type SecretResolutionResult = {
  secretId: string;
  resolved: boolean;
  /** Placeholder token — never contains decrypted secret values. */
  placeholder: string;
};

export function resolveSecretReference(
  reference: IntegrationSecretReference,
): SecretResolutionResult {
  return {
    secretId: reference.secretId,
    resolved: false,
    placeholder: `[secret:${reference.secretId}]`,
  };
}

export function resolveSecretReferences(
  references: IntegrationSecretReference[] = [],
): SecretResolutionResult[] {
  return references.map(resolveSecretReference);
}

export function collectMissingSecretIds(
  references: IntegrationSecretReference[] = [],
): string[] {
  return references.map((reference) => reference.secretId).filter(Boolean);
}

export function extractSecretIdFromConfig(config: unknown): string | null {
  if (!config || typeof config !== "object") {
    return null;
  }

  const record = config as Record<string, unknown>;
  return typeof record.secretId === "string" && record.secretId.trim() !== ""
    ? record.secretId
    : null;
}
