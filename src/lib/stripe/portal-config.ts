import "server-only";

import { getStripeClient } from "@/lib/stripe/client";

let cachedCancellationEnabled: boolean | null = null;
let cacheExpiresAt = 0;

const CACHE_TTL_MS = 5 * 60 * 1000;

/** Whether the active Stripe Customer Portal configuration allows subscription cancellation. */
export async function isStripePortalCancellationEnabled(): Promise<boolean> {
  if (cachedCancellationEnabled !== null && Date.now() < cacheExpiresAt) {
    return cachedCancellationEnabled;
  }

  try {
    const stripe = getStripeClient();
    const { data } = await stripe.billingPortal.configurations.list({ limit: 10, active: true });
    const config = data.find((item) => item.is_default) ?? data[0];
    const enabled = config?.features?.subscription_cancel?.enabled === true;

    cachedCancellationEnabled = enabled;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;

    return enabled;
  } catch (error) {
    console.warn(
      "[stripe] portal cancellation config lookup failed:",
      error instanceof Error ? error.message : error,
    );
    cachedCancellationEnabled = false;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return false;
  }
}
