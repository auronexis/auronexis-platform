import type { IntegrationProviderId } from "@/lib/integrations/types";
import {
  INTEGRATION_SECRET_TYPES,
  type CreateIntegrationSecretInput,
  type RotateIntegrationSecretInput,
  type UpdateIntegrationSecretInput,
} from "@/lib/integrations/secrets/types";

export type SecretValidationError = {
  field: string;
  message: string;
};

export type SecretValidationResult = {
  valid: boolean;
  errors: SecretValidationError[];
};

export function validateCreateSecretInput(input: CreateIntegrationSecretInput): SecretValidationResult {
  const errors: SecretValidationError[] = [];

  if (!input.name?.trim()) {
    errors.push({ field: "name", message: "Name is required." });
  } else if (input.name.trim().length > 120) {
    errors.push({ field: "name", message: "Name must be 120 characters or fewer." });
  }

  if (!input.providerId?.trim()) {
    errors.push({ field: "providerId", message: "Provider is required." });
  }

  if (!INTEGRATION_SECRET_TYPES.includes(input.secretType)) {
    errors.push({ field: "secretType", message: "Invalid secret type." });
  }

  if (!input.plaintextValue?.trim()) {
    errors.push({ field: "plaintextValue", message: "Secret value is required." });
  } else if (input.plaintextValue.length > 8192) {
    errors.push({ field: "plaintextValue", message: "Secret value is too long." });
  }

  if (input.description && input.description.length > 500) {
    errors.push({ field: "description", message: "Description must be 500 characters or fewer." });
  }

  return { valid: errors.length === 0, errors };
}

export function validateRotateSecretInput(input: RotateIntegrationSecretInput): SecretValidationResult {
  const errors: SecretValidationError[] = [];

  if (!input.secretId?.trim()) {
    errors.push({ field: "secretId", message: "Secret id is required." });
  }

  if (!input.plaintextValue?.trim()) {
    errors.push({ field: "plaintextValue", message: "New secret value is required." });
  } else if (input.plaintextValue.length > 8192) {
    errors.push({ field: "plaintextValue", message: "Secret value is too long." });
  }

  return { valid: errors.length === 0, errors };
}

export function validateUpdateSecretInput(input: UpdateIntegrationSecretInput): SecretValidationResult {
  const errors: SecretValidationError[] = [];

  if (!input.secretId?.trim()) {
    errors.push({ field: "secretId", message: "Secret id is required." });
  }

  if (input.name != null && input.name.trim() === "") {
    errors.push({ field: "name", message: "Name cannot be empty." });
  }

  return { valid: errors.length === 0, errors };
}

export function isKnownProviderId(providerId: string): providerId is IntegrationProviderId {
  return providerId.trim().length > 0;
}
