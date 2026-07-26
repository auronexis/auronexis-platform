import "server-only";

import { buildFastSpringCheckoutTags } from "@/lib/fastspring/checkout-tags";
import {
  getFastSpringProductCatalogEntry,
  isFastSpringProductPath,
} from "@/lib/fastspring/products";
import {
  FASTSPRING_POPUP_CHECKOUT_PATH,
  FASTSPRING_SBL_SCRIPT_SRC,
  buildFastSpringTestStorefront,
  type FastSpringTestCheckoutPayload,
} from "@/lib/fastspring/test-checkout-types";

export {
  FASTSPRING_POPUP_CHECKOUT_PATH,
  FASTSPRING_SBL_SCRIPT_SRC,
  buildFastSpringTestStorefront,
  type FastSpringTestCheckoutPayload,
} from "@/lib/fastspring/test-checkout-types";

/**
 * Store subdomain only (e.g. `yourstore`).
 * Test storefront becomes: `{storeId}.test.onfastspring.com/popup-defaultB2B`
 * https://developer.fastspring.com/docs/add-checkout-to-your-site
 */
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
  return Boolean(process.env.FASTSPRING_STORE_ID?.trim());
}

/**
 * Build a server-validated FastSpring TEST checkout payload for Store Builder.
 * Does not grant entitlements — webhook sync does.
 */
export function createFastSpringTestCheckoutPayload(input: {
  organizationId: string;
  userId: string;
  productPath: string;
}): FastSpringTestCheckoutPayload {
  if (!isFastSpringProductPath(input.productPath)) {
    throw new Error("Invalid FastSpring product path.");
  }

  const entry = getFastSpringProductCatalogEntry(input.productPath);
  if (!entry) {
    throw new Error("Unknown FastSpring product path.");
  }

  const storeId = getFastSpringStoreId();
  const tags = buildFastSpringCheckoutTags({
    organizationId: input.organizationId,
    userId: input.userId,
    internalPlan: entry.mappedPlan,
  });

  return {
    mode: "test",
    provider: "fastspring",
    storefront: buildFastSpringTestStorefront(storeId),
    popupCheckoutPath: FASTSPRING_POPUP_CHECKOUT_PATH,
    sblScriptSrc: FASTSPRING_SBL_SCRIPT_SRC,
    productPath: entry.path,
    displayName: entry.displayName,
    tags,
    monthlyPriceUsd: entry.monthlyPriceUsd,
  };
}
