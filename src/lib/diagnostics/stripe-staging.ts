import "server-only";

import { getBillingDiagnosticsSnapshot } from "@/lib/billing/diagnostics";
import { getStripeEnvDiagnostics } from "@/lib/diagnostics/stripe-env";
import { checkStripeHealth } from "@/lib/diagnostics/platform-health";
import { getStripeWebhookDiagnostics } from "@/lib/stripe/idempotency";
import type { SessionContext } from "@/lib/tenancy/context";

export type StripeStagingReadiness = {
  stripeReadiness: boolean;
  portalReadiness: boolean;
  webhookReadiness: boolean;
  invoiceReadiness: boolean;
  billingReadiness: boolean;
  checkoutConfigured: boolean;
  webhookTableReachable: boolean;
  processedWebhooks: number;
  failedWebhooks: number;
  invoiceCount: number;
  subscriptionActive: boolean;
};

/** Staging Stripe readiness — aggregates env, webhooks, and billing diagnostics. */
export async function getStripeStagingReadiness(
  session: SessionContext,
): Promise<StripeStagingReadiness> {
  const [billing, webhook, stripeEnv] = await Promise.all([
    getBillingDiagnosticsSnapshot(session),
    getStripeWebhookDiagnostics(),
    Promise.resolve(getStripeEnvDiagnostics()),
  ]);

  const stripeHealth = checkStripeHealth(stripeEnv);
  const checkoutConfigured = stripeHealth.ok;
  const subscriptionActive =
    billing.subscriptionState === "active" || billing.subscriptionState === "trialing";
  const portalReadiness = checkoutConfigured && subscriptionActive;
  const webhookReadiness =
    webhook.tableReachable && webhook.failedEvents === 0 && checkoutConfigured;
  const invoiceReadiness = billing.invoiceCount > 0 || subscriptionActive;
  const billingReadiness =
    checkoutConfigured && billing.usageMeteringEnabled && billing.forecastStatus !== "critical";

  return {
    stripeReadiness: checkoutConfigured && webhook.tableReachable,
    portalReadiness,
    webhookReadiness,
    invoiceReadiness,
    billingReadiness,
    checkoutConfigured,
    webhookTableReachable: webhook.tableReachable,
    processedWebhooks: webhook.processedEvents,
    failedWebhooks: webhook.failedEvents,
    invoiceCount: billing.invoiceCount,
    subscriptionActive,
  };
}
