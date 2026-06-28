import "server-only";

import { randomBytes, createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { ConnectorId } from "@/lib/connectors/types";

export type OAuthStateRecord = {
  id: string;
  organizationId: string;
  connectorId: ConnectorId;
  stateToken: string;
  codeVerifier: string | null;
  redirectUri: string;
  scopes: string[];
  expiresAt: string;
};

const STATE_TTL_MS = 10 * 60 * 1000;

export function generateOAuthStateToken(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

export function generatePkceVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function generatePkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function createOAuthState(input: {
  organizationId: string;
  connectorId: ConnectorId;
  redirectUri: string;
  scopes: string[];
  createdBy?: string;
  usePkce?: boolean;
}): Promise<OAuthStateRecord> {
  const supabase = await createClient();
  const stateToken = generateOAuthStateToken();
  const codeVerifier = input.usePkce ? generatePkceVerifier() : null;
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString();

  const { data, error } = await supabase
    .from("integration_oauth_states")
    .insert({
      organization_id: input.organizationId,
      connector_id: input.connectorId,
      state_token: stateToken,
      code_verifier: codeVerifier,
      redirect_uri: input.redirectUri,
      scopes: input.scopes,
      expires_at: expiresAt,
      created_by: input.createdBy ?? null,
    } as never)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create OAuth state: ${error?.message ?? "unknown"}`);
  }

  const row = data as {
    id: string;
    organization_id: string;
    connector_id: string;
    state_token: string;
    code_verifier: string | null;
    redirect_uri: string;
    scopes: string[];
    expires_at: string;
  };

  return {
    id: row.id,
    organizationId: row.organization_id,
    connectorId: row.connector_id as ConnectorId,
    stateToken: row.state_token,
    codeVerifier: row.code_verifier,
    redirectUri: row.redirect_uri,
    scopes: row.scopes ?? [],
    expiresAt: row.expires_at,
  };
}

export async function consumeOAuthState(
  stateToken: string,
): Promise<OAuthStateRecord | null> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("integration_oauth_states")
    .select("*")
    .eq("state_token", stateToken)
    .is("consumed_at", null)
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  await supabase
    .from("integration_oauth_states")
    .update({ consumed_at: now } as never)
    .eq("id", (data as { id: string }).id);

  const row = data as {
    id: string;
    organization_id: string;
    connector_id: string;
    state_token: string;
    code_verifier: string | null;
    redirect_uri: string;
    scopes: string[];
    expires_at: string;
  };

  return {
    id: row.id,
    organizationId: row.organization_id,
    connectorId: row.connector_id as ConnectorId,
    stateToken: row.state_token,
    codeVerifier: row.code_verifier,
    redirectUri: row.redirect_uri,
    scopes: row.scopes ?? [],
    expiresAt: row.expires_at,
  };
}

export function validateOAuthState(record: OAuthStateRecord, connectorId: ConnectorId): boolean {
  return record.connectorId === connectorId && new Date(record.expiresAt).getTime() > Date.now();
}
