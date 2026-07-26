import "server-only";

import {
  getCatalogEntryByProductPath,
  isFastSpringProductPath,
} from "@/lib/billing/catalog";
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

export {
  FASTSPRING_POPUP_CHECKOUT_PATH,
  FASTSPRING_SBL_SCRIPT_SRC,
  buildFastSpringTestStorefront,
  type FastSpringTestCheckoutPayload,
} from "@/lib/fastspring/test-checkout-types";

/** @deprecated Prefer isFastSpringStorefrontConfigured / FASTSPRING_STOREFRONT. */
export function getFastSpringStoreId(): string {
  const value = process.env.FASTSPRING_STORE_ID?.trim();
  if (!value) {
    throw new Error("Missing required environment variable: FASTSPRING_STORE_ID");
  }
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(value)) {
    throw new Error("Invalid FASTSPRING_STORE_ID.");
  }
  return value;
}

export function isFastSpringStoreConfigured(): boolean {
  return isFastSpringStorefrontConfigured();
}

/**
 * Build a server-validated FastSpring checkout payload for the owner/admin test page.
 * Prefer test storefronts; production storefronts are allowed when explicitly configured.
 */
export function createFastSpringTestCheckoutPayload(input: {
  organizationId: string;
  userId: string;
  productPath: string;
}): FastSpringTestCheckoutPayload {
  if (!isFastSpringProductPath(input.productPath)) {
    throw new Error("Invalid FastSpring product path.");
  }

  const entry = getCatalogEntryByProductPath(input.productPath);
  if (!entry) {
    throw new Error("Unknown FastSpring product path.");
  }

  const storefront = getFastSpringStorefront();
  const isTest = isFastSpringTestStorefront(storefront);
  const tags = buildFastSpringCheckoutTags({
    organizationId: input.organizationId,
    userId: input.userId,
    internalPlan: entry.internalKey,
  });

  return {
    mode: isTest ? "test" : "live",
    provider: "fastspring",
    storefront,
    popupCheckoutPath: FASTSPRING_POPUP_CHECKOUT_PATH,
    sblScriptSrc: FASTSPRING_SBL_SCRIPT_SRC,
    productPath: entry.productPath,
    displayName: entry.displayName,
    tags,
    monthlyPriceUsd: entry.fallbackMonthlyUsd,
  };
}
