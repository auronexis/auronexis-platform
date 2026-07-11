"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/events";

type CustomerSuccessTrackerProps = {
  event:
    | "customer_success_page_viewed"
    | "client_success_viewed"
    | "customer_success_summary_viewed"
    | "success_playbook_started"
    | "success_task_completed";
  organizationId: string;
  extra?: Record<string, string | number | boolean>;
};

const PREFIX = "auroranexis_cs_event_";

export function CustomerSuccessTracker({
  event,
  organizationId,
  extra,
}: CustomerSuccessTrackerProps) {
  useEffect(() => {
    const key = `${PREFIX}${organizationId}_${event}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackAnalyticsEvent(event, extra);
  }, [event, organizationId, extra]);

  return null;
}
