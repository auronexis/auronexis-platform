import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type MollieTestSubscriptionRow = {
  id: string;
  organization_id: string;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  plan_key: string;
  provider_price_id: string | null;
  provider_status: string | null;
  status: string;
  first_payment_id: string | null;
  mandate_id: string | null;
  checkout_attempt_id: string | null;
  amount_value: string | null;
  amount_currency: string;
  sync_pending: boolean;
  last_reconciled_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function getMollieTestSubscriptionForOrg(
  organizationId: string,
): Promise<MollieTestSubscriptionRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mollie_test_subscriptions")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read Mollie test subscription: ${error.message}`);
  }

  return (data as MollieTestSubscriptionRow | null) ?? null;
}

export async function upsertMollieTestSubscription(
  input: Partial<MollieTestSubscriptionRow> & { organization_id: string; plan_key: string },
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin.from("mollie_test_subscriptions").upsert(
    {
      ...input,
      updated_at: now,
    } as never,
    { onConflict: "organization_id" },
  );

  if (error) {
    throw new Error(`Failed to upsert Mollie test subscription: ${error.message}`);
  }
}
