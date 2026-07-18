import "server-only";

import type { CheckoutResult, InternalPlan, PaddleCheckoutCustomData } from "@/lib/billing/provider-types";
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
 * Stripe removed from active billing — abandoned Stripe remnants (historical
 * archive only) never block Paddle checkout. Access is NOT granted here —
 * webhook/server reconciliation grants access.
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
