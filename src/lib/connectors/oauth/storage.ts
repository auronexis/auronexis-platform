import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  getDecryptedSecretValue,
  markSecretUsed,
} from "@/lib/integrations/secrets/repository";
import { encryptSecretValue } from "@/lib/integrations/secrets/encryption";
import { maskSecretValue } from "@/lib/integrations/secrets/masking";
import type { ConnectorId } from "@/lib/connectors/types";
import type { IntegrationConnection } from "@/types/database";

export type StoredOAuthTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string[];
};

export async function storeOAuthTokens(input: {
  organizationId: string;
  connectorId: ConnectorId;
  displayName: string;
  tokens: StoredOAuthTokens;
  createdBy: string;
}): Promise<string> {
  const supabase = await createClient();

  const accessEncrypted = encryptSecretValue(input.tokens.accessToken);
  const refreshEncrypted = input.tokens.refreshToken
    ? encryptSecretValue(input.tokens.refreshToken)
    : null;

  const { data: accessSecret, error: accessError } = await supabase
    .from("integration_secrets")
    .insert({
      organization_id: input.organizationId,
      provider_id: input.connectorId,
      name: `${input.connectorId}-access-${Date.now()}`,
      secret_type: "oauth_access_token",
      encrypted_value: accessEncrypted,
      status: "active",
      expires_at: input.tokens.expiresAt,
      created_by: input.createdBy,
      updated_by: input.createdBy,
      metadata: { masked_preview: maskSecretValue(input.tokens.accessToken) },
    } as never)
    .select("id")
    .single();

  if (accessError || !accessSecret) {
    throw new Error(`Failed to store access token: ${accessError?.message ?? "unknown"}`);
  }

  let refreshSecretId: string | null = null;
  if (refreshEncrypted && input.tokens.refreshToken) {
    const { data: refreshSecret, error: refreshError } = await supabase
      .from("integration_secrets")
      .insert({
        organization_id: input.organizationId,
        provider_id: input.connectorId,
        name: `${input.connectorId}-refresh-${Date.now()}`,
        secret_type: "oauth_refresh_token",
        encrypted_value: refreshEncrypted,
        status: "active",
        created_by: input.createdBy,
        updated_by: input.createdBy,
        metadata: { masked_preview: maskSecretValue(input.tokens.refreshToken) },
      } as never)
      .select("id")
      .single();

    if (refreshError || !refreshSecret) {
      throw new Error(`Failed to store refresh token: ${refreshError?.message ?? "unknown"}`);
    }
    refreshSecretId = (refreshSecret as { id: string }).id;
  }

  const { data: connection, error: connectionError } = await supabase
    .from("integration_connections")
    .insert({
      organization_id: input.organizationId,
      connector_id: input.connectorId,
      connector_version: "1.0.0",
      display_name: input.displayName,
      status: "connected",
      access_secret_id: (accessSecret as { id: string }).id,
      refresh_secret_id: refreshSecretId,
      scopes: input.tokens.scopes,
      token_expires_at: input.tokens.expiresAt,
      health_status: "healthy",
      created_by: input.createdBy,
      updated_by: input.createdBy,
    } as never)
    .select("id")
    .single();

  if (connectionError || !connection) {
    throw new Error(`Failed to create connection: ${connectionError?.message ?? "unknown"}`);
  }

  return (connection as { id: string }).id;
}

export async function loadOAuthTokensForConnection(
  organizationId: string,
  connection: Pick<IntegrationConnection, "access_secret_id" | "refresh_secret_id">,
): Promise<StoredOAuthTokens | null> {
  if (!connection.access_secret_id) {
    return null;
  }

  const accessToken = await getDecryptedSecretValue(organizationId, connection.access_secret_id);
  if (!accessToken) {
    return null;
  }

  let refreshToken: string | null = null;
  if (connection.refresh_secret_id) {
    refreshToken = await getDecryptedSecretValue(organizationId, connection.refresh_secret_id);
  }

  await markSecretUsed(connection.access_secret_id, organizationId);

  return {
    accessToken,
    refreshToken,
    expiresAt: null,
    scopes: [],
  };
}

export async function revokeConnectionTokens(
  organizationId: string,
  connectionId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integration_connections")
    .select("access_secret_id, refresh_secret_id")
    .eq("organization_id", organizationId)
    .eq("id", connectionId)
    .maybeSingle();

  if (error || !data) {
    return;
  }

  const row = data as { access_secret_id: string | null; refresh_secret_id: string | null };
  const secretIds = [row.access_secret_id, row.refresh_secret_id].filter(Boolean) as string[];

  if (secretIds.length > 0) {
    await supabase
      .from("integration_secrets")
      .update({ status: "inactive" } as never)
      .eq("organization_id", organizationId)
      .in("id", secretIds);
  }

  await supabase
    .from("integration_connections")
    .update({ status: "revoked", health_status: "unhealthy" } as never)
    .eq("organization_id", organizationId)
    .eq("id", connectionId);
}
