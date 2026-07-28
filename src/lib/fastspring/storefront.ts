import "server-only";

import { FASTSPRING_POPUP_CHECKOUT_PATH } from "@/lib/fastspring/test-checkout-types";

/**
 * Exact Store Builder `data-storefront` value from FastSpring:
 * Checkouts → Popup Checkouts → Place on your website → data-storefront
 *
 * Example shapes (do not invent store subdomain):
 * - mystore.test.onfastspring.com/popup-defaultB2B
 * - mystore.onfastspring.com/popup-defaultB2B
 */
export function getFastSpringStorefront(): string {
  const exact = process.env.FASTSPRING_STOREFRONT?.trim();
  if (exact) {
    if (!isPlausibleStorefront(exact)) {
      throw new Error("Invalid FASTSPRING_STOREFRONT.");
    }
    return stripProtocol(exact);
  }

  // Back-compat: construct test storefront from store subdomain only.
  const storeId = process.env.FASTSPRING_STORE_ID?.trim();
  if (storeId) {
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(storeId)) {
      throw new Error("Invalid FASTSPRING_STORE_ID.");
    }
    return `${storeId}.test.onfastspring.com/${FASTSPRING_POPUP_CHECKOUT_PATH}`;
  }

  throw new Error(
    "Missing FastSpring storefront configuration. Set FASTSPRING_STOREFRONT to the exact data-storefront value from the FastSpring dashboard.",
  );
}

export function isFastSpringStorefrontConfigured(): boolean {
  const exact = process.env.FASTSPRING_STOREFRONT?.trim();
  if (exact) {
    return isPlausibleStorefront(exact);
  }
  return Boolean(process.env.FASTSPRING_STORE_ID?.trim());
}

export function isFastSpringTestStorefront(storefront: string): boolean {
  return storefront.includes(".test.onfastspring.com/");
}

/**
 * Exact, non-test `FASTSPRING_STOREFRONT` only — no `FASTSPRING_STORE_ID`
 * test-storefront fallback. Required for public/production self-serve
 * checkout so a misconfigured environment can never silently charge through
 * a FastSpring test storefront. Fails closed (throws) when unmet.
 */
export function getLiveFastSpringStorefront(): string {
  const exact = process.env.FASTSPRING_STOREFRONT?.trim();
  if (!exact) {
    throw new Error(
      "Missing FASTSPRING_STOREFRONT. Public checkout requires the exact live data-storefront value from the FastSpring dashboard.",
    );
  }

  if (!isPlausibleStorefront(exact)) {
    throw new Error("Invalid FASTSPRING_STOREFRONT.");
  }

  const normalized = stripProtocol(exact);
  if (isFastSpringTestStorefront(normalized)) {
    throw new Error(
      "FASTSPRING_STOREFRONT is a test storefront (.test.onfastspring.com). Public checkout requires a live storefront.",
    );
  }

  return normalized;
}

/** True when a live (non-test), exact `FASTSPRING_STOREFRONT` is configured. Fails closed. */
export function isFastSpringLiveCheckoutConfigured(): boolean {
  try {
    getLiveFastSpringStorefront();
    return true;
  } catch {
    return false;
  }
}

function stripProtocol(value: string): string {
  return value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function isPlausibleStorefront(value: string): boolean {
  const normalized = stripProtocol(value);
  return (
    /^[a-z0-9][a-z0-9.-]*\.onfastspring\.com\/[a-z0-9_-]+$/i.test(normalized) &&
    normalized.includes(FASTSPRING_POPUP_CHECKOUT_PATH)
  );
}
