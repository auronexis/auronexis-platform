"use client";

import { useEffect } from "react";
import type { AdoptionSnapshot } from "@/lib/adoption/types";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { buildAdoptionAnalyticsProps } from "@/lib/adoption/events";

type AdoptionTrackerProps = {
  event:
    | "adoption_page_viewed"
    | "adoption_score_viewed"
    | "adoption_summary_viewed"
    | "retention_risk_detected"
    | "adoption_stage_changed"
    | "adoption_trend_changed";
  snapshot: AdoptionSnapshot;
  sourceRoute?: string;
};

const SESSION_PREFIX = "auroranexis_adoption_event_";

function shouldEmitOnce(event: string, orgId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const key = `${SESSION_PREFIX}${orgId}_${event}`;
  if (sessionStorage.getItem(key)) {
    return false;
  }
  sessionStorage.setItem(key, "1");
  return true;
}

/** Consent-gated adoption analytics — once per session, no PII. */
export function AdoptionTracker({ event, snapshot, sourceRoute }: AdoptionTrackerProps) {
  useEffect(() => {
    if (!shouldEmitOnce(event, snapshot.organizationId)) {
      return;
    }

    trackAnalyticsEvent(
      event,
      buildAdoptionAnalyticsProps(snapshot, {
        source_route: sourceRoute ?? "unknown",
      }),
    );
  }, [event, snapshot, sourceRoute]);

  return null;
}
