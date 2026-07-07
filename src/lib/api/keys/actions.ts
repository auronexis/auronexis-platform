"use server";

import { requireSession } from "@/lib/auth/session";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api/keys/repository";
import type { ApiKeyCreateResult, ApiKeyType, ApiKeyView, ApiScope } from "@/lib/api/types";
import type { ApiKeyMode } from "@/lib/api/keys/hash";
import { validateApiScopes } from "@/lib/api/auth/scopes";
import { requireFeatureAccess } from "@/lib/entitlements/checks";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { createClient } from "@/lib/supabase/server";
import { createWebhookEndpointAction as createWebhookEndpointInternal } from "@/lib/webhooks/actions";
import { disableWebhookEndpointAction as disableWebhookEndpointInternal } from "@/lib/webhooks/actions";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function ensureApiAccess() {
  const session = await requireSession();
  await requireFeatureAccess("api", session);
  if (!canManageOrganizationSettings(session)) {
    throw new Error("Only organization owners and admins can manage API keys.");
  }
  return session;
}

function toActionError(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export async function listApiKeysAction(): Promise<ActionResult<ApiKeyView[]>> {
  try {
    const session = await ensureApiAccess();
    const data = await listApiKeys(session);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function createApiKeyAction(input: {
  name: string;
  keyType: ApiKeyType;
  keyMode?: ApiKeyMode;
  scopes: ApiScope[];
  expiresAt?: string | null;
}): Promise<ActionResult<ApiKeyCreateResult>> {
  try {
    const session = await ensureApiAccess();
    validateApiScopes(input.scopes);
    const data = await createApiKey({
      session,
      name: input.name,
      keyType: input.keyType,
      keyMode: input.keyMode,
      scopes: input.scopes,
      expiresAt: input.expiresAt,
    });
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function revokeApiKeyAction(keyId: string): Promise<ActionResult<null>> {
  try {
    const session = await ensureApiAccess();
    await revokeApiKey(session, keyId);
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function createWebhookEndpointAction(input: {
  name: string;
  url: string;
  events: string[];
}): Promise<ActionResult<{ endpointId: string; signingSecret: string; url: string }>> {
  try {
    const session = await ensureApiAccess();
    const { endpoint, signingSecret } = await createWebhookEndpointInternal({
      session,
      name: input.name,
      url: input.url,
      events: input.events,
    });
    return {
      ok: true,
      data: { endpointId: endpoint.id, signingSecret, url: endpoint.url },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function disableWebhookEndpointAction(
  endpointId: string,
): Promise<ActionResult<null>> {
  try {
    const session = await ensureApiAccess();
    await disableWebhookEndpointInternal(session, endpointId);
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function listWebhookEndpointsAction(): Promise<
  ActionResult<Array<{ id: string; url: string; name: string; events: string[]; active: boolean }>>
> {
  try {
    const session = await ensureApiAccess();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .select("id, url, name, events, active")
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return {
      ok: true,
      data: (data ?? []) as Array<{
        id: string;
        url: string;
        name: string;
        events: string[];
        active: boolean;
      }>,
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
