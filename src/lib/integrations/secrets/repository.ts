import "server-only";

import { createClient } from "@/lib/supabase/server";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import type { SessionContext } from "@/lib/tenancy/context";
import type { IntegrationSecret } from "@/types/database";
import {
  assertEncryptionKeyForSecretCreation,
  decryptSecretValue,
  encryptSecretValue,
} from "@/lib/integrations/secrets/encryption";
import { maskSecretValue } from "@/lib/integrations/secrets/masking";
import type {
  CreateIntegrationSecretInput,
  IntegrationSecretMetadata,
  IntegrationSecretReferenceView,
  ProviderCredentialSummary,
  RotateIntegrationSecretInput,
  UpdateIntegrationSecretInput,
} from "@/lib/integrations/secrets/types";
import {
  validateCreateSecretInput,
  validateRotateSecretInput,
  validateUpdateSecretInput,
} from "@/lib/integrations/secrets/validation";

function assertSecretManagementAccess(session: SessionContext): void {
  if (!canManageOrganizationSettings(session)) {
    throw new Error("You do not have permission to manage integration secrets.");
  }
}

function rowToReferenceView(row: IntegrationSecret): IntegrationSecretReferenceView {
  const metadata = (row.metadata ?? {}) as IntegrationSecretMetadata;

  return {
    id: row.id,
    organizationId: row.organization_id,
    providerId: row.provider_id,
    name: row.name,
    description: row.description,
    secretType: row.secret_type,
    status: row.status,
    maskedPreview: metadata.masked_preview ?? "****",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at,
    rotationDueAt: row.rotation_due_at,
    expiresAt: row.expires_at,
  };
}

export async function listSecretReferences(
  session: SessionContext,
): Promise<IntegrationSecretReferenceView[]> {
  assertSecretManagementAccess(session);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_secrets")
    .select("*")
    .eq("organization_id", session.organization.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list integration secrets: ${error.message}`);
  }

  return ((data ?? []) as IntegrationSecret[]).map(rowToReferenceView);
}

export async function getSecretReference(
  session: SessionContext,
  secretId: string,
): Promise<IntegrationSecretReferenceView | null> {
  assertSecretManagementAccess(session);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_secrets")
    .select("*")
    .eq("organization_id", session.organization.id)
    .eq("id", secretId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load integration secret: ${error.message}`);
  }

  return data ? rowToReferenceView(data as IntegrationSecret) : null;
}

export async function validateSecretAccess(
  organizationId: string,
  secretId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_secrets")
    .select("id, status, expires_at")
    .eq("organization_id", organizationId)
    .eq("id", secretId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const row = data as Pick<IntegrationSecret, "id" | "status" | "expires_at">;
  if (row.status === "inactive" || row.status === "expired") {
    return false;
  }

  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return false;
  }

  return true;
}

export async function markSecretUsed(secretId: string, organizationId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("integration_secrets")
    .update({ last_used_at: new Date().toISOString() } as never)
    .eq("organization_id", organizationId)
    .eq("id", secretId);
}

export async function createSecret(
  session: SessionContext,
  input: CreateIntegrationSecretInput,
): Promise<IntegrationSecretReferenceView> {
  assertSecretManagementAccess(session);

  const validation = validateCreateSecretInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.map((error) => error.message).join("; "));
  }

  assertEncryptionKeyForSecretCreation();

  const encryptedValue = encryptSecretValue(input.plaintextValue.trim());
  const metadata: IntegrationSecretMetadata = {
    masked_preview: maskSecretValue(input.plaintextValue.trim()),
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_secrets")
    .insert({
      organization_id: session.organization.id,
      provider_id: input.providerId,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      secret_type: input.secretType,
      encrypted_value: encryptedValue,
      status: "active",
      created_by: session.user.id,
      updated_by: session.user.id,
      rotation_due_at: input.rotationDueAt ?? null,
      expires_at: input.expiresAt ?? null,
      metadata,
    } as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create integration secret: ${error.message}`);
  }

  return rowToReferenceView(data as IntegrationSecret);
}

export async function updateSecret(
  session: SessionContext,
  input: UpdateIntegrationSecretInput,
): Promise<IntegrationSecretReferenceView> {
  assertSecretManagementAccess(session);

  const validation = validateUpdateSecretInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.map((error) => error.message).join("; "));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_secrets")
    .update({
      ...(input.name != null ? { name: input.name.trim() } : {}),
      ...(input.description != null ? { description: input.description.trim() || null } : {}),
      ...(input.status != null ? { status: input.status } : {}),
      ...(input.rotationDueAt !== undefined ? { rotation_due_at: input.rotationDueAt } : {}),
      ...(input.expiresAt !== undefined ? { expires_at: input.expiresAt } : {}),
      updated_by: session.user.id,
    } as never)
    .eq("organization_id", session.organization.id)
    .eq("id", input.secretId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update integration secret: ${error.message}`);
  }

  return rowToReferenceView(data as IntegrationSecret);
}

export async function rotateSecret(
  session: SessionContext,
  input: RotateIntegrationSecretInput,
): Promise<IntegrationSecretReferenceView> {
  assertSecretManagementAccess(session);

  const validation = validateRotateSecretInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.map((error) => error.message).join("; "));
  }

  assertEncryptionKeyForSecretCreation();

  const encryptedValue = encryptSecretValue(input.plaintextValue.trim());
  const metadata: IntegrationSecretMetadata = {
    masked_preview: maskSecretValue(input.plaintextValue.trim()),
  };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("integration_secrets")
    .update({
      encrypted_value: encryptedValue,
      metadata,
      status: "active",
      updated_by: session.user.id,
      rotation_due_at: input.rotationDueAt ?? null,
    } as never)
    .eq("organization_id", session.organization.id)
    .eq("id", input.secretId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to rotate integration secret: ${error.message}`);
  }

  return rowToReferenceView(data as IntegrationSecret);
}

export async function deleteSecret(session: SessionContext, secretId: string): Promise<void> {
  assertSecretManagementAccess(session);
  const supabase = await createClient();

  const { error } = await supabase
    .from("integration_secrets")
    .delete()
    .eq("organization_id", session.organization.id)
    .eq("id", secretId);

  if (error) {
    throw new Error(`Failed to delete integration secret: ${error.message}`);
  }
}

/** Server-only decrypt for future execution paths — never return to UI. */
export async function getDecryptedSecretValue(
  organizationId: string,
  secretId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_secrets")
    .select("encrypted_value, status, expires_at")
    .eq("organization_id", organizationId)
    .eq("id", secretId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as Pick<IntegrationSecret, "encrypted_value" | "status" | "expires_at">;
  if (row.status !== "active") {
    return null;
  }

  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return decryptSecretValue(row.encrypted_value);
}

export async function getProviderCredentialSummaries(
  session: SessionContext,
): Promise<ProviderCredentialSummary[]> {
  assertSecretManagementAccess(session);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_secrets")
    .select("provider_id, status")
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error(`Failed to load provider credential summary: ${error.message}`);
  }

  const rows = (data ?? []) as Array<Pick<IntegrationSecret, "provider_id" | "status">>;
  const grouped = new Map<string, { total: number; active: number }>();

  for (const row of rows) {
    const current = grouped.get(row.provider_id) ?? { total: 0, active: 0 };
    current.total += 1;
    if (row.status === "active") {
      current.active += 1;
    }
    grouped.set(row.provider_id, current);
  }

  return Array.from(grouped.entries()).map(([providerId, counts]) => ({
    providerId,
    configuredSecretCount: counts.total,
    activeSecretCount: counts.active,
    missingCredentials: counts.active === 0,
  }));
}

export async function countSecretsForOrganization(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("integration_secrets")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(`Failed to count integration secrets: ${error.message}`);
  }

  return count ?? 0;
}
