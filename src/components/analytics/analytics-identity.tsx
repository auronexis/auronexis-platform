"use client";

import { useEffect } from "react";
import { applyAnalyticsIdentity, setAnalyticsIdentity } from "@/lib/analytics/identity";

type AnalyticsIdentityProps = {
  /** Internal user id (UUID) — pseudonymous, never an email or name. */
  userId: string;
  role: string;
  isInternal: boolean;
};

/**
 * Links product-analytics events to the signed-in user (only with analytics consent) and marks
 * internal/test users so PostHog's test-account filter excludes them.
 */
export function AnalyticsIdentity({ userId, role, isInternal }: AnalyticsIdentityProps) {
  useEffect(() => {
    setAnalyticsIdentity({ userId, role, isInternal });
    applyAnalyticsIdentity();
  }, [userId, role, isInternal]);

  return null;
}
