import type { FastSpringCheckoutTags } from "@/lib/fastspring/checkout-tags";
import type { FastSpringProductPath } from "@/lib/fastspring/products";

/** Exact popup checkout path configured for Auroranexis. */
export const FASTSPRING_POPUP_CHECKOUT_PATH = "popup-defaultB2B";

/** Official Store Builder Library script (current docs use 1.0.6). */
export const FASTSPRING_SBL_SCRIPT_SRC =
  "https://sbl.onfastspring.com/sbl/1.0.6/fastspring-builder.min.js";

/**
 * Client-safe FastSpring TEST checkout payload.
 * Built only on the server; consumed by the Store Builder panel.
 */
export type FastSpringTestCheckoutPayload = {
  mode: "test";
  provider: "fastspring";
  storefront: string;
  popupCheckoutPath: typeof FASTSPRING_POPUP_CHECKOUT_PATH;
  sblScriptSrc: typeof FASTSPRING_SBL_SCRIPT_SRC;
  productPath: FastSpringProductPath;
  displayName: string;
  tags: FastSpringCheckoutTags;
  /** Display-only catalog price; FastSpring owns live checkout amounts. */
  monthlyPriceUsd: number;
};

/** Always test-mode for this integration phase — never live. */
export function buildFastSpringTestStorefront(storeId: string): string {
  return `${storeId}.test.onfastspring.com/${FASTSPRING_POPUP_CHECKOUT_PATH}`;
}
