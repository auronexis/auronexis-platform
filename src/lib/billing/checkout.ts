import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import { validateDiscountCode } from "@/lib/billing/discounts";
import { createCheckoutSession as createStripeCheckoutSession } from "@/lib/stripe/subscriptions";

export async function createCheckoutSessionWithDiscount(input: {
  organizationId: string;
  organizationName: string;
  email: string;
  planKey: PlanKey;
  userId?: string;
  discountCode?: string | null;
}): Promise<string> {
  if (input.discountCode) {
    const validation = await validateDiscountCode(input.discountCode, input.planKey);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
  }

  return createStripeCheckoutSession({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    email: input.email,
    planKey: input.planKey,
    userId: input.userId,
  });
}

export { createCheckoutSession } from "@/lib/stripe/subscriptions";
