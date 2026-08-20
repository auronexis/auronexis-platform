/**
 * Neutral billing provider types — UI and business logic depend on these,
 * not on Stripe- or Paddle-specific shapes.
 *
 * Stripe and Paddle have been removed from active billing. "stripe" and
 * "paddle" remain in this union only to label historical/archived data
 * (legacy subscription rows, invoices, webhook events) — neither is ever
 * returned by getActiveBillingProvider() and neither drives new checkout,
 * portal access, or entitlements.
 *
 * "fastspring" is the global default active checkout provider.
 *
 * "mollie" is Phase 3 production-capable via per-org allowlist/rollout only —
 * never returned by getActiveBillingProvider(). Org resolution uses
 * resolveOrganizationBillingProvider / getOrganizationBillingProvider.
 * Generic provider_* columns on organization_subscriptions are the persistence target.
 */

import type { FastSpringCheckoutTags } from "@/lib/fastspring/checkout-tags";
import type { FastSpringProductPath } from "@/lib/billing/catalog";

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
      provider: "fastspring";
      mode: "popup";
      storefront: string;
      sblScriptSrc: string;
      productPath: FastSpringProductPath;
      tags: FastSpringCheckoutTags;
      checkoutMode: "test" | "live";
      pendingSyncMessage: string;
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
