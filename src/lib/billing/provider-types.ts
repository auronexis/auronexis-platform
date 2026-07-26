/**
 * Neutral billing provider types — UI and business logic depend on these,
 * not on Stripe- or Paddle-specific shapes.
 *
 * Stripe has been removed from active billing. "stripe" remains in this
 * union only to label historical/archived data (legacy subscription rows,
 * invoices, webhook events) — it must never be returned by
 * getActiveBillingProvider() and must never drive new checkout.
 *
 * "fastspring" is the active checkout provider for NEW purchases.
 * Usable legacy Paddle rows continue to grant entitlements until natural end.
 */

import type { FastSpringCheckoutTags } from "@/lib/fastspring/checkout-tags";
import type { FastSpringProductPath } from "@/lib/billing/catalog";

export type BillingProvider = "stripe" | "paddle" | "fastspring";

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
      provider: "paddle";
      mode: "overlay";
      /** Allowlisted Paddle price ID chosen server-side. */
      priceId: string;
      clientToken: string;
      environment: "sandbox" | "production";
      customData: PaddleCheckoutCustomData;
      pendingSyncMessage: string;
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
    };

export type PortalResult = {
  provider: BillingProvider;
  portalUrl: string;
};

export type PaddleCheckoutCustomData = {
  organization_id: string;
  initiating_user_id: string;
  internal_plan: InternalPlan;
  schema_version: "1";
};

export function isInternalPlan(value: string | null | undefined): value is InternalPlan {
  return value === "professional" || value === "business" || value === "enterprise";
}
