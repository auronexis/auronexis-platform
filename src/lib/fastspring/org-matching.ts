import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Deterministic organization resolution for FastSpring webhooks.
 *
 * Prefer:
 * 1. Explicit organization_id tag (when checkout later passes it)
 * 2. account.lookup.custom when it is an Auroranexis organization UUID
 * 3. Existing FastSpring provider_subscription_id / provider_customer_id rows
 *
 * Never match by customer email alone.
 */
export function extractOrganizationIdCandidate(input: {
  tags?: Record<string, string>;
  customLookupId?: string | null;
}): string | null {
  const tags = input.tags ?? {};
  const fromTag =
    asString(tags.organization_id) ??
    asString(tags.organizationId) ??
    asString(tags.auroranexis_organization_id);
  if (fromTag && isUuid(fromTag)) {
    return fromTag;
  }

  const custom = asString(input.customLookupId);
  if (custom && isUuid(custom)) {
    return custom;
  }

  return null;
}

export async function findOrganizationByFastSpringSubscriptionId(
  subscriptionId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_subscriptions")
    .select("organization_id")
    .eq("billing_provider", "fastspring")
    .eq("provider_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) {
    console.error("[fastspring] org lookup by subscription failed:", {
      message: error.message,
      subscriptionIdPrefix: subscriptionId.slice(0, 8),
    });
    return null;
  }

  return asString((data as { organization_id?: string } | null)?.organization_id);
}

export async function findOrganizationByFastSpringAccountId(
  accountId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_subscriptions")
    .select("organization_id")
    .eq("billing_provider", "fastspring")
    .eq("provider_customer_id", accountId)
    .maybeSingle();

  if (error) {
    console.error("[fastspring] org lookup by account failed:", {
      message: error.message,
      accountIdPrefix: accountId.slice(0, 8),
    });
    return null;
  }

  return asString((data as { organization_id?: string } | null)?.organization_id);
}

export async function resolveFastSpringOrganizationId(input: {
  tags?: Record<string, string>;
  customLookupId?: string | null;
  subscriptionId?: string | null;
  accountId?: string | null;
}): Promise<{ organizationId: string | null; matchMethod: string | null }> {
  const candidate = extractOrganizationIdCandidate({
    tags: input.tags,
    customLookupId: input.customLookupId,
  });
  if (candidate) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("organizations")
      .select("id")
      .eq("id", candidate)
      .maybeSingle();
    if (error) {
      console.error("[fastspring] org candidate validation failed:", {
        message: error.message,
      });
      return { organizationId: null, matchMethod: null };
    }
    if (data) {
      return { organizationId: candidate, matchMethod: "deterministic_tag_or_custom_lookup" };
    }
  }

  if (input.subscriptionId) {
    const bySub = await findOrganizationByFastSpringSubscriptionId(input.subscriptionId);
    if (bySub) {
      return { organizationId: bySub, matchMethod: "provider_subscription_id" };
    }
  }

  if (input.accountId) {
    const byAccount = await findOrganizationByFastSpringAccountId(input.accountId);
    if (byAccount) {
      return { organizationId: byAccount, matchMethod: "provider_customer_id" };
    }
  }

  return { organizationId: null, matchMethod: null };
}
