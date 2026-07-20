"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import {
  trackFeatureAdoption,
  trackMonthlyActiveUsage,
  trackWeeklyActiveUsage,
  trackWorkspaceHealthViewed,
} from "@/lib/analytics/adoption-metrics";

type DashboardAnalyticsTrackerProps = {
  isRecentSignup: boolean;
  planTier: string;
};

/**
 * Workspace analytics — dashboard load + adoption cadence.
 * Signup/workspace completion is queued from the signup form (pending events) to avoid double-fire.
 */
export function DashboardAnalyticsTracker({
  isRecentSignup,
  planTier,
}: DashboardAnalyticsTrackerProps) {
  useEffect(() => {
    trackAnalyticsEvent("dashboard_loaded", {
      surface: "dashboard",
      module: "dashboard",
      plan_tier: planTier,
    });
    trackFeatureAdoption("dashboard", "dashboard");
    trackWeeklyActiveUsage("dashboard");
    trackMonthlyActiveUsage("dashboard");
    trackWorkspaceHealthViewed("dashboard");

    if (isRecentSignup) {
      const activationKey = "auroranexis:activation_completed_tracked";
      if (!sessionStorage.getItem(activationKey)) {
        sessionStorage.setItem(activationKey, "1");
        trackAnalyticsEvent("activation_completed", {
          surface: "dashboard",
          module: "dashboard",
          funnel_stage: "trial_activation",
        });
      }
    }
  }, [isRecentSignup, planTier]);

  return null;
}
