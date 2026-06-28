"use server";

import { requireSession } from "@/lib/auth/session";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api/keys/repository";
import { createWebhookEndpoint } from "@/lib/api/webhooks/dispatcher";
import type { ApiKeyCreateResult, ApiKeyType, ApiKeyView, ApiScope } from "@/lib/api/types";
import { validateApiScopes } from "@/lib/api/auth/scopes";
import { checkPlanFeatureForSession } from "@/lib/plans/guards";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import { createClient } from "@/lib/supabase/server";
import type { ApiWebhookEndpoint } from "@/types/database";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function ensureApiAccess() {
  const session = await requireSession();
  const access = await checkPlanFeatureForSession(session, "future_api_webhooks");
  if (!access.allowed) {
    throw new Error(access.message ?? "Enterprise plan required for Public API.");
  }
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
  url: string;
  description?: string;
  events: string[];
}): Promise<ActionResult<{ endpointId: string; signingSecret: string; url: string }>> {
  try {
    const session = await ensureApiAccess();
    const { endpoint, signingSecret } = await createWebhookEndpoint({
      organizationId: session.organization.id,
      url: input.url,
      description: input.description,
      events: input.events,
      createdBy: session.user.id,
    });
    return {
      ok: true,
      data: { endpointId: endpoint.id, signingSecret, url: endpoint.url },
    };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

export async function listWebhookEndpointsAction(): Promise<
  ActionResult<Array<{ id: string; url: string; events: string[]; status: ApiWebhookEndpoint["status"] }>>
> {
  try {
    const session = await ensureApiAccess();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("api_webhook_endpoints")
      .select("id, url, events, status")
      .eq("organization_id", session.organization.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true, data: (data ?? []) as Array<{ id: string; url: string; events: string[]; status: ApiWebhookEndpoint["status"] }> };
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}
