import "server-only";

import { trackServerAnalyticsEvent } from "@/lib/analytics/server-events";
import type { AnalyticsEventProps } from "@/lib/analytics/events";

/**
 * Billing lifecycle analytics integration points.
 * Call from billing webhooks/actions in Release chapters — does not alter billing provider behaviour.
 * Props must remain free of org/customer identifiers and secrets.
 */
export async function trackBillingLifecycleEvent(
  name:
    | "invoice_paid"
    | "invoice_failed"
    | "subscription_upgraded"
    | "subscription_downgraded"
    | "subscription_cancelled"
    | "subscription_checkout_completed"
    | "plan_selected"
    | "billing_portal_opened",
  props?: AnalyticsEventProps,
): Promise<void> {
  await trackServerAnalyticsEvent(name, {
    ...props,
    module: "billing",
    funnel: "conversion",
  });
}
