/**
 * Conversion funnel stages — measurable SaaS journey without PII.
 * Stages are catalog metadata; emitters attach `funnel_stage` when known.
 */

export const CONVERSION_FUNNEL_STAGES = [
  "landing_page",
  "pricing",
  "signup",
  "email_verification",
  "workspace_creation",
  "first_client",
  "first_report",
  "first_ai_action",
  "trial_activation",
  "subscription_purchase",
  "upgrade",
  "expansion",
] as const;

export type ConversionFunnelStage = (typeof CONVERSION_FUNNEL_STAGES)[number];

/** Map canonical analytics events to funnel stages where applicable. */
export const EVENT_FUNNEL_STAGE: Partial<Record<string, ConversionFunnelStage>> = {
  landing_page_view: "landing_page",
  pricing_view: "pricing",
  signup_started: "signup",
  signup_completed: "signup",
  workspace_created: "workspace_creation",
  first_client_created: "first_client",
  client_created: "first_client",
  first_report_created: "first_report",
  report_generated: "first_report",
  ai_summary_generated: "first_ai_action",
  ai_summary_generation_started: "first_ai_action",
  activation_completed: "trial_activation",
  subscription_checkout_started: "subscription_purchase",
  subscription_checkout_completed: "subscription_purchase",
  subscription_upgraded: "upgrade",
  expansion_signal: "expansion",
};

export function resolveFunnelStage(eventName: string): ConversionFunnelStage | undefined {
  return EVENT_FUNNEL_STAGE[eventName];
}
