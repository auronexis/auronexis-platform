import "server-only";

import type { CheckoutResult, InternalPlan, PaddleCheckoutCustomData } from "@/lib/billing/provider-types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaddleClientToken, getPaddleEnvironment, isPaddleConfigured } from "@/lib/paddle/env";
import { getPaddlePriceIdForPlan } from "@/lib/paddle/prices";
import { markOrganizationSyncPending } from "@/lib/paddle/sync";

export type CreatePaddleCheckoutInput = {
  organizationId: string;
  userId: string;
  planKey: InternalPlan;
  email: string;
};

/**
 * Prepare a Paddle.js overlay checkout payload.
 * Access is NOT granted here — webhook/server reconciliation grants access.
 */
export async function createPaddleCheckoutPayload(
  input: CreatePaddleCheckoutInput,
): Promise<Extract<CheckoutResult, { provider: "paddle" }>> {
  if (!isPaddleConfigured()) {
    throw new Error("Paddle is not fully configured. Check PADDLE_* environment variables.");
  }

  if (input.planKey === "enterprise") {
    throw new Error("Contact sales for Enterprise plans.");
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("organization_subscriptions")
    .select("billing_provider, stripe_subscription_id")
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  const row = existing as {
    billing_provider?: string;
    stripe_subscription_id?: string | null;
  } | null;

  if (row?.billing_provider === "stripe" && row.stripe_subscription_id) {
    throw new Error(
      "This organization already has a Stripe subscription. Manage billing through the Stripe portal.",
    );
  }

  const priceId = getPaddlePriceIdForPlan(input.planKey);
  const customData: PaddleCheckoutCustomData = {
    organization_id: input.organizationId,
    initiating_user_id: input.userId,
    internal_plan: input.planKey,
    schema_version: "1",
  };

  await markOrganizationSyncPending(input.organizationId);

  return {
    provider: "paddle",
    mode: "overlay",
    priceId,
    clientToken: getPaddleClientToken(),
    environment: getPaddleEnvironment(),
    customData,
    pendingSyncMessage:
      "Checkout opened. Access updates after Paddle confirms payment — this may take a moment.",
  };
}
