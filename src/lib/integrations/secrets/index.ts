export type {
  CreateIntegrationSecretInput,
  IntegrationSecretMetadata,
  IntegrationSecretReferenceView,
  IntegrationSecretsDiagnosticsSnapshot,
  ProviderCredentialSummary,
  RotateIntegrationSecretInput,
  UpdateIntegrationSecretInput,
} from "@/lib/integrations/secrets/types";
export {
  INTEGRATION_SECRET_STATUS_LABELS,
  INTEGRATION_SECRET_TYPE_LABELS,
  INTEGRATION_SECRET_TYPES,
} from "@/lib/integrations/secrets/types";

export {
  assertEncryptionKeyForSecretCreation,
  decryptSecretValue,
  encryptSecretValue,
  getIntegrationEncryptionKeyStatus,
  type IntegrationEncryptionKeyStatus,
} from "@/lib/integrations/secrets/encryption";

export {
  maskSecretValue,
  redactSecretFields,
  sanitizeLogPayload,
} from "@/lib/integrations/secrets/masking";

export {
  collectMissingSecretIds,
  extractSecretIdFromConfig,
  resolveSecretReference,
  resolveSecretReferences,
  type SecretResolutionResult,
} from "@/lib/integrations/secrets/references";

export {
  validateCreateSecretInput,
  validateRotateSecretInput,
  validateUpdateSecretInput,
} from "@/lib/integrations/secrets/validation";

export {
  countSecretsForOrganization,
  createSecret,
  deleteSecret,
  getDecryptedSecretValue,
  getProviderCredentialSummaries,
  getSecretReference,
  listSecretReferences,
  markSecretUsed,
  rotateSecret,
  updateSecret,
  validateSecretAccess,
} from "@/lib/integrations/secrets/repository";

export { getIntegrationSecretsDiagnostics } from "@/lib/integrations/secrets/health";

export {
  createIntegrationSecretAction,
  deleteIntegrationSecretAction,
  listIntegrationSecretsAction,
  rotateIntegrationSecretAction,
} from "@/lib/integrations/secrets/actions";
