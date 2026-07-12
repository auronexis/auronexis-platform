"use client";

import { useEffect } from "react";
import { trackConversionEvent } from "@/lib/analytics/events";

type BillingConversionTrackerProps = {
  checkoutSuccess: boolean;
  checkoutCancelled: boolean;
  planTier: string;
};

/** Billing conversion events on the settings billing surface. */
export function BillingConversionTracker({
  checkoutSuccess,
  checkoutCancelled,
  planTier,
}: BillingConversionTrackerProps) {
  useEffect(() => {
    if (checkoutSuccess) {
      const key = "auroranexis:billing_checkout_completed";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        trackConversionEvent("subscription_checkout_completed", {
          surface: "settings_billing",
          plan_tier: planTier,
        });
      }
    }

    if (checkoutCancelled) {
      trackConversionEvent("subscription_checkout_started", {
        surface: "settings_billing",
        outcome: "cancelled",
        plan_tier: planTier,
      });
    }
  }, [checkoutCancelled, checkoutSuccess, planTier]);

  return null;
}
