import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { recordActivityEvent } from "@/lib/activity/record";
import { validateApiScopes } from "@/lib/api/auth/scopes";
import { generateApiKeyMaterial, type ApiKeyMode } from "@/lib/api/keys/hash";
import type {
  ApiKeyCreateResult,
  ApiKeyType,
  ApiKeyView,
  ApiScope,
} from "@/lib/api/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ApiKey } from "@/types/database";

function rowToView(row: ApiKey): ApiKeyView {
  return {
    id: row.id,
    organizationId: row.organization_id,
    keyType: row.key_type as ApiKeyType,
    name: row.name,
    keyPrefix: row.key_prefix,
    scopes: (row.scopes ?? []) as ApiScope[],
    status: row.status,
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listApiKeys(session: SessionContext): Promise<ApiKeyView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("organization_id", session.organization.id)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return ((data ?? []) as ApiKey[]).map(rowToView);
}

export async function createApiKey(input: {
  session: SessionContext;
  name: string;
  keyType: ApiKeyType;
  keyMode?: ApiKeyMode;
  scopes: ApiScope[];
  expiresAt?: string | null;
}): Promise<ApiKeyCreateResult> {
  const scopes = validateApiScopes(input.scopes);
  const material = generateApiKeyMaterial(input.keyMode ?? "live");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      organization_id: input.session.organization.id,
      key_type: input.keyType,
      name: input.name.trim(),
      key_prefix: material.prefix,
      key_hash: material.hash,
      scopes,
      status: "active",
      expires_at: input.expiresAt ?? null,
      created_by: input.session.user.id,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create API key.");
  }

  await recordActivityEvent({
    organizationId: input.session.organization.id,
    actorUserId: input.session.user.id,
    entityType: "organization",
    entityId: input.session.organization.id,
    eventType: "api_key.created",
    action: "api_key_created",
    title: `API key created: ${input.name.trim()}`,
    metadata: { keyId: (data as ApiKey).id, keyPrefix: material.prefix },
  }).catch(() => undefined);

  const view = rowToView(data as ApiKey);
  return { ...view, plaintextKey: material.plaintext };
}

export async function revokeApiKey(session: SessionContext, keyId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ status: "revoked", revoked_at: new Date().toISOString() } as never)
    .eq("organization_id", session.organization.id)
    .eq("id", keyId);

  if (error) {
    throw new Error(error.message);
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "organization",
    entityId: session.organization.id,
    eventType: "api_key.revoked",
    action: "api_key_revoked",
    title: "API key revoked",
    metadata: { keyId },
  }).catch(() => undefined);
}

export async function getApiKeyByHash(keyHash: string): Promise<ApiKey | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("status", "active")
    .maybeSingle();

  return (data as ApiKey | null) ?? null;
}
