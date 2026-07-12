"use client";

import { useEffect } from "react";
import { consumePendingAnalyticsEvents } from "@/lib/analytics/pending-events";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

/** Flushes server-redirect and form-queued analytics events on the client. */
export function AnalyticsEventFlusher() {
  useEffect(() => {
    for (const event of consumePendingAnalyticsEvents()) {
      trackAnalyticsEvent(event.name as Parameters<typeof trackAnalyticsEvent>[0], event.props);
    }
  }, []);

  return null;
}
