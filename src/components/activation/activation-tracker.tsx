"use client";

import { useEffect } from "react";
import type { ActivationStage } from "@/lib/activation/types";
import { trackAnalyticsEvent } from "@/lib/analytics/events";
import { shouldEmitMilestoneEvent } from "@/lib/activation/events";

type ActivationTrackerProps = {
  organizationId: string;
  event:
    | "onboarding_viewed"
    | "onboarding_started"
    | "activation_milestone_reached"
    | "workspace_activated"
    | "activation_stage_changed";
  stage?: ActivationStage;
  completionPercent?: number;
  sourceRoute?: string;
  milestoneKey?: string;
};

/** Fire activation analytics once per session — no PII. */
export function ActivationTracker({
  organizationId,
  event,
  stage,
  completionPercent,
  sourceRoute,
  milestoneKey,
}: ActivationTrackerProps) {
  useEffect(() => {
    if (milestoneKey && !shouldEmitMilestoneEvent(organizationId, milestoneKey)) {
      return;
    }

    trackAnalyticsEvent(event, {
      activation_stage: stage ?? "getting_started",
      completion_percentage: completionPercent ?? 0,
      source_route: sourceRoute ?? "unknown",
    });
  }, [organizationId, event, stage, completionPercent, sourceRoute, milestoneKey]);

  return null;
}
