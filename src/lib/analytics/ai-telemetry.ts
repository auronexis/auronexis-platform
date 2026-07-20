/**
 * Privacy-safe AI product telemetry helpers.
 * Never log prompts, completions, or customer-sensitive AI inputs.
 */

import { trackAnalyticsEvent, type AnalyticsEventName, type AnalyticsEventProps } from "@/lib/analytics/events";

export type AITelemetryResult = "success" | "failure" | "retry" | "fallback" | "cancelled";

type TrackAITelemetryInput = {
  event: AnalyticsEventName;
  feature: string;
  module?: string;
  provider?: string;
  model?: string;
  result?: AITelemetryResult;
  duration_ms?: number;
  surface?: string;
};

/** Emit a sanitized AI analytics event — tokens stay in DB usage tables, not third-party sinks. */
export function trackAITelemetryEvent(input: TrackAITelemetryInput): void {
  const props: AnalyticsEventProps = {
    feature: input.feature,
    module: input.module ?? "ai",
  };

  if (input.provider) props.provider = input.provider;
  if (input.model) props.model = input.model;
  if (input.result) props.result = input.result;
  if (typeof input.duration_ms === "number") props.duration_ms = Math.max(0, Math.round(input.duration_ms));
  if (input.surface) props.surface = input.surface;

  trackAnalyticsEvent(input.event, props);
}
