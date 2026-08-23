/**
 * Neutral billing provider types — UI and business logic depend on these,
 * not on Stripe- or Paddle-specific shapes.
 *
 * Stripe, Paddle, and FastSpring remain in this union only to label
 * historical/archived data (legacy subscription rows, invoices, webhook events).
 * None of them is returned by getActiveBillingProvider() or drives new checkout.
 *
 * "mollie" is the global default active checkout provider (sole active provider).
 * Rollout / per-org allowlist still gate NEW Mollie eligibility when rollout is off.
 * Generic provider_* columns on organization_subscriptions are the persistence target.
 */

import type { PlanKey } from "@/lib/billing/plans";

export type BillingProvider = "stripe" | "paddle" | "fastspring" | "mollie";

/** Self-serve / commercial plans sold via checkout (excludes internal starter fallback). */
export type InternalPlan = "professional" | "business" | "enterprise";

export type NormalizedSubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"
  | "incomplete"
  | "inactive"
  | "payment_failed";

export type CheckoutResult =
  | {
      provider: "stripe";
      mode: "redirect";
      checkoutUrl: string;
    }
  | {
      provider: "mollie";
      mode: "redirect";
      checkoutUrl: string;
      checkoutAttemptId: string;
      pendingSyncMessage: string;
    };

export type PortalResult = {
  provider: BillingProvider;
  portalUrl: string;
};

export function isInternalPlan(value: string | null | undefined): value is InternalPlan {
  return value === "professional" || value === "business" || value === "enterprise";
}

export type SelfServePlanKey = Extract<PlanKey, "professional" | "business" | "enterprise">;
