import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/env";

let stripeClient: Stripe | null = null;

/** Singleton Stripe SDK client — server-only. */
export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      typescript: true,
    });
  }

  return stripeClient;
}
