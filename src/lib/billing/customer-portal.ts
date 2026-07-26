import "server-only";

import {
  hasVerifiedPaddleCustomer,
  isPaddleBackedSubscription,
} from "@/lib/billing/active-billing";
import { ORGANIZATION_SUBSCRIPTION_SELECT } from "@/lib/billing/queries";
import { createPaddlePortalSession } from "@/lib/paddle/portal";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationSubscription } from "@/types/database";

/**
 * Open a customer portal when a supported legacy path exists.
 *
 * FastSpring does not expose an equivalent hosted portal in this integration —
 * only verified legacy Paddle customers can open the Paddle portal.
 */
export async function openCustomerPortal(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  returnUrl?: string;
}): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_subscriptions")
    .select(ORGANIZATION_SUBSCRIPTION_SELECT)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const subscription = data as OrganizationSubscription | null;

  if (isPaddleBackedSubscription(subscription) && hasVerifiedPaddleCustomer(subscription)) {
    return createPaddlePortalSession({ organizationId: input.organizationId });
  }

  throw new Error(
    "A FastSpring-hosted billing portal is not available. Manage changes via your FastSpring purchase email or contact support. Legacy Paddle customers can use the Paddle portal after a completed Paddle subscription.",
  );
}
