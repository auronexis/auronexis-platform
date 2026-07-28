import "server-only";

import {
  getCatalogEntryByPlanKey,
  getCatalogEntryByProductPath,
  isPublicFastSpringProductPath,
  normalizeFastSpringProductPath,
  type FastSpringProductPath,
} from "@/lib/billing/catalog";
import type { InternalPlan } from "@/lib/billing/provider-types";
import { buildFastSpringCheckoutTags } from "@/lib/fastspring/checkout-tags";
import {
  getFastSpringStorefront,
  getLiveFastSpringStorefront,
  isFastSpringLiveCheckoutConfigured,
  isFastSpringStorefrontConfigured,
  isFastSpringTestStorefront,
} from "@/lib/fastspring/storefront";
import {
  FASTSPRING_POPUP_CHECKOUT_PATH,
  FASTSPRING_SBL_SCRIPT_SRC,
  type FastSpringTestCheckoutPayload,
} from "@/lib/fastspring/test-checkout-types";

export type FastSpringCheckoutPayload = FastSpringTestCheckoutPayload & {
  /** true when storefront host contains .test.onfastspring.com */
  isTestStorefront: boolean;
};

/**
 * Public self-serve checkout readiness. In production this requires a live
 * (non-test) `FASTSPRING_STOREFRONT` — a test storefront never counts as
 * "configured" for the customer-facing checkout flow.
 */
export function isFastSpringCheckoutConfigured(): boolean {
  if (process.env.NODE_ENV === "production") {
    return isFastSpringLiveCheckoutConfigured();
  }
  return isFastSpringStorefrontConfigured();
}

/**
 * Build a server-validated FastSpring checkout payload for Store Builder.
 * Public self-serve allows professional/business/enterprise only.
 * Private paths require allowPrivateProducts.
 *
 * Storefront safety: in production this always resolves the exact live
 * `FASTSPRING_STOREFRONT` and fails closed — it never falls back to a
 * `FASTSPRING_STORE_ID`-derived test storefront. `allowTestStorefront` is
 * reserved for internal test-checkout callers only and must never be set
 * from a public/customer-facing code path.
 */
export function createFastSpringCheckoutPayload(input: {
  organizationId: string;
  userId: string;
  productPath: string;
  allowPrivateProducts?: boolean;
  allowTestStorefront?: boolean;
}): FastSpringCheckoutPayload {
  const path = normalizeFastSpringProductPath(input.productPath);
  if (!path) {
    throw new Error("Invalid FastSpring product path.");
  }

  if (!input.allowPrivateProducts && !isPublicFastSpringProductPath(path)) {
    throw new Error("This FastSpring product is not available for self-serve checkout.");
  }

  const entry = getCatalogEntryByProductPath(path);
  if (!entry) {
    throw new Error("Unknown FastSpring product path.");
  }

  const storefront =
    process.env.NODE_ENV === "production" && !input.allowTestStorefront
      ? getLiveFastSpringStorefront()
      : getFastSpringStorefront();
  const tags = buildFastSpringCheckoutTags({
    organizationId: input.organizationId,
    userId: input.userId,
    internalPlan: entry.internalKey,
  });

  const isTestStorefront = isFastSpringTestStorefront(storefront);
  return {
    mode: isTestStorefront ? "test" : "live",
    provider: "fastspring",
    storefront,
    popupCheckoutPath: FASTSPRING_POPUP_CHECKOUT_PATH,
    sblScriptSrc: FASTSPRING_SBL_SCRIPT_SRC,
    productPath: entry.productPath,
    displayName: entry.displayName,
    tags,
    monthlyPriceUsd: entry.fallbackMonthlyUsd,
    isTestStorefront,
  };
}

export function createFastSpringCheckoutPayloadForPlan(input: {
  organizationId: string;
  userId: string;
  planKey: InternalPlan;
}): FastSpringCheckoutPayload {
  const entry = getCatalogEntryByPlanKey(input.planKey);
  if (!entry) {
    throw new Error("Invalid subscription plan selected.");
  }
  return createFastSpringCheckoutPayload({
    organizationId: input.organizationId,
    userId: input.userId,
    productPath: entry.productPath,
    allowPrivateProducts: false,
  });
}

export function assertPublicCheckoutProductPath(
  productPath: FastSpringProductPath,
): void {
  if (!isPublicFastSpringProductPath(productPath)) {
    throw new Error("This FastSpring product is not available for self-serve checkout.");
  }
}
