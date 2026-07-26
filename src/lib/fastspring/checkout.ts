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

export function isFastSpringCheckoutConfigured(): boolean {
  return isFastSpringStorefrontConfigured();
}

/**
 * Build a server-validated FastSpring checkout payload for Store Builder.
 * Public self-serve allows professional/business/enterprise only.
 * Private paths require allowPrivateProducts.
 */
export function createFastSpringCheckoutPayload(input: {
  organizationId: string;
  userId: string;
  productPath: string;
  allowPrivateProducts?: boolean;
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

  const storefront = getFastSpringStorefront();
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
