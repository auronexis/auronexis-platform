"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

type ConversionTrackerProps = {
  event: Parameters<typeof trackAnalyticsEvent>[0];
  props?: Parameters<typeof trackAnalyticsEvent>[1];
};

/** Fires a single conversion event on mount — respects consent via trackAnalyticsEvent. */
export function ConversionTracker({ event, props }: ConversionTrackerProps) {
  useEffect(() => {
    trackAnalyticsEvent(event, props);
  }, [event, props]);

  return null;
}
