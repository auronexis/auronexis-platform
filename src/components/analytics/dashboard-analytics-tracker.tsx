"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import {
  trackMonthlyActiveUsage,
  trackWeeklyActiveUsage,
  trackWorkspaceHealthViewed,
} from "@/lib/analytics/adoption-metrics";

type DashboardAnalyticsTrackerProps = {
  isRecentSignup: boolean;
  planTier: string;
};

/** Workspace analytics — dashboard load, signup completion, adoption cadence. */
export function DashboardAnalyticsTracker({
  isRecentSignup,
  planTier,
}: DashboardAnalyticsTrackerProps) {
  useEffect(() => {
    trackAnalyticsEvent("dashboard_loaded", {
      surface: "dashboard",
      plan_tier: planTier,
    });
    trackWeeklyActiveUsage("dashboard");
    trackMonthlyActiveUsage("dashboard");
    trackWorkspaceHealthViewed("dashboard");

    if (isRecentSignup) {
      const signupKey = "auroranexis:signup_completion_tracked";
      if (!sessionStorage.getItem(signupKey)) {
        sessionStorage.setItem(signupKey, "1");
        trackAnalyticsEvent("signup_completed", { surface: "dashboard" });
        trackAnalyticsEvent("workspace_created", { surface: "dashboard", plan_tier: planTier });
        trackAnalyticsEvent("activation_completed", { surface: "dashboard" });
      }
    }
  }, [isRecentSignup, planTier]);

  return null;
}
