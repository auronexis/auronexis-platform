import type { IntegrationProviderId } from "@/lib/integrations/types";
import type { IntegrationSecretStatus, IntegrationSecretType } from "@/types/database";

export type IntegrationSecretMetadata = {
  masked_preview?: string;
};

export type IntegrationSecretReferenceView = {
  id: string;
  organizationId: string;
  providerId: IntegrationProviderId | string;
  name: string;
  description: string | null;
  secretType: IntegrationSecretType;
  status: IntegrationSecretStatus;
  maskedPreview: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  rotationDueAt: string | null;
  expiresAt: string | null;
};

export type CreateIntegrationSecretInput = {
  providerId: IntegrationProviderId | string;
  name: string;
  description?: string;
  secretType: IntegrationSecretType;
  plaintextValue: string;
  rotationDueAt?: string | null;
  expiresAt?: string | null;
};

export type UpdateIntegrationSecretInput = {
  secretId: string;
  name?: string;
  description?: string;
  status?: IntegrationSecretStatus;
  rotationDueAt?: string | null;
  expiresAt?: string | null;
};

export type RotateIntegrationSecretInput = {
  secretId: string;
  plaintextValue: string;
  rotationDueAt?: string | null;
};

export type IntegrationSecretsDiagnosticsSnapshot = {
  tableReachable: boolean;
  encryptionKeyConfigured: boolean;
  encryptionKeyWarning: string | null;
  secretCount: number;
  activeSecretCount: number;
  providersWithCredentials: number;
  expiredSecretCount: number;
  rotationDueCount: number;
};

export type ProviderCredentialSummary = {
  providerId: IntegrationProviderId | string;
  configuredSecretCount: number;
  activeSecretCount: number;
  missingCredentials: boolean;
};

export const INTEGRATION_SECRET_TYPES: IntegrationSecretType[] = [
  "bearer_token",
  "api_key",
  "basic_auth",
  "webhook_secret",
  "smtp_credentials",
  "oauth_placeholder",
  "oauth_access_token",
  "oauth_refresh_token",
];

export const INTEGRATION_SECRET_TYPE_LABELS: Record<IntegrationSecretType, string> = {
  bearer_token: "Bearer token",
  api_key: "API key",
  basic_auth: "Basic auth",
  webhook_secret: "Webhook secret",
  smtp_credentials: "SMTP credentials",
  oauth_placeholder: "OAuth (placeholder)",
  oauth_access_token: "OAuth access token",
  oauth_refresh_token: "OAuth refresh token",
};

export const INTEGRATION_SECRET_STATUS_LABELS: Record<IntegrationSecretStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  pending_rotation: "Pending rotation",
};
