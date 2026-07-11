"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import type { ExecutiveIntelligenceAnalyticsEvent } from "@/lib/executive-intelligence/events";

type ExecutiveIntelligenceTrackerProps = {
  event: ExecutiveIntelligenceAnalyticsEvent;
  organizationId: string;
  extra?: Record<string, string | number | boolean>;
};

const PREFIX = "auroranexis_ei_event_";

export function ExecutiveIntelligenceTracker({
  event,
  organizationId,
  extra,
}: ExecutiveIntelligenceTrackerProps) {
  useEffect(() => {
    const key = `${PREFIX}${organizationId}_${event}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackAnalyticsEvent(event, extra);
  }, [event, organizationId, extra]);

  return null;
}
