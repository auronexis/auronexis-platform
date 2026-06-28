import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPlan } from "@/lib/plans/queries";
import { isFeatureEnabled } from "@/lib/plans/features";
import type { ApiContext } from "@/lib/api/auth/context";
import { parseApiScopes } from "@/lib/api/auth/scopes";
import { getApiKeyByHash } from "@/lib/api/keys/repository";
import {
  constantTimeCompareHash,
  extractBearerToken,
  hashApiKey,
  isApiKeyFormat,
} from "@/lib/api/keys/hash";
import type { ApiScope } from "@/lib/api/types";
import type { AppUser, Organization, UserRole } from "@/types/database";

export class ApiAuthenticationError extends Error {
  constructor(message = "Invalid API key.") {
    super(message);
    this.name = "ApiAuthenticationError";
  }
}

export class ApiFeatureError extends Error {
  constructor(message = "Public API is not available on your plan.") {
    super(message);
    this.name = "ApiFeatureError";
  }
}

export async function authenticateApiRequest(request: Request): Promise<ApiContext> {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token || !isApiKeyFormat(token)) {
    throw new ApiAuthenticationError();
  }

  const keyHash = hashApiKey(token);
  const row = await getApiKeyByHash(keyHash);
  if (!row || !constantTimeCompareHash(row.key_hash, keyHash)) {
    throw new ApiAuthenticationError();
  }

  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    throw new ApiAuthenticationError("API key expired.");
  }

  const admin = createAdminClient();
  const [{ data: organization }, { data: creator }] = await Promise.all([
    admin.from("organizations").select("*").eq("id", row.organization_id).maybeSingle(),
    row.created_by
      ? admin.from("users").select("id, auth_user_id, email, role").eq("id", row.created_by).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!organization) {
    throw new ApiAuthenticationError();
  }

  const planKey = await getCurrentPlan(organization.id);
  if (!isFeatureEnabled(planKey, "future_api_webhooks")) {
    throw new ApiFeatureError();
  }

  const creatorUser = creator as Pick<AppUser, "id" | "auth_user_id" | "email" | "role"> | null;
  const userRole: UserRole = row.key_type === "workspace" ? "admin" : (creatorUser?.role ?? "staff");

  await admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() } as never)
    .eq("id", row.id);

  return {
    apiKeyId: row.id,
    keyType: row.key_type,
    scopes: parseApiScopes(row.scopes) as ApiScope[],
    organization: organization as Organization,
    planKey,
    userId: creatorUser?.id ?? row.created_by,
    userRole,
    authUserId: creatorUser?.auth_user_id ?? null,
    email: creatorUser?.email ?? null,
  };
}
