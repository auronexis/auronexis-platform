import "server-only";

import { randomUUID } from "node:crypto";

import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  MOLLIE_METADATA_ORGANIZATION_ID,
} from "@/lib/billing/providers/mollie/foundation";
import { assertMollieTestModeOnly } from "@/lib/billing/providers/mollie/mode";
import { getMollieTestSubscriptionForOrg } from "@/lib/billing/providers/mollie/sync";
import { createAdminClient } from "@/lib/supabase/admin";

export type MollieCustomerResult = {
  customerId: string;
  created: boolean;
};

/**
 * Idempotent Mollie Customer for an organization.
 * Reuses provider_customer_id from mollie_test_subscriptions when present.
 */
export async function getOrCreateMollieCustomer(input: {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
}): Promise<MollieCustomerResult> {
  assertMollieTestModeOnly();

  const existing = await getMollieTestSubscriptionForOrg(input.organizationId);
  const existingCustomerId = existing?.provider_customer_id?.trim();
  if (existingCustomerId?.startsWith("cst_")) {
    return { customerId: existingCustomerId, created: false };
  }

  const client = createMollieBillingClient();
  const correlationId = randomUUID();

  const customer = await client.customers.create({
    name: input.organizationName.slice(0, 255) || "Auroranexis Organization",
    email: input.ownerEmail,
    metadata: {
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      auroranexis_correlation_id: correlationId,
    },
  });

  const customerId = customer.id;
  if (!customerId?.startsWith("cst_")) {
    throw new Error("Mollie customer creation returned an invalid customer id.");
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("mollie_test_subscriptions").upsert(
    {
      organization_id: input.organizationId,
      provider_customer_id: customerId,
      plan_key: existing?.plan_key ?? "professional",
      sync_pending: true,
      updated_at: now,
    } as never,
    { onConflict: "organization_id" },
  );

  if (error) {
    throw new Error(`Failed to persist Mollie customer mapping: ${error.message}`);
  }

  return { customerId, created: true };
}
