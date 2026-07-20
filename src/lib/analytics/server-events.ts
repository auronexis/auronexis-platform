import "server-only";

import type { AnalyticsEventProps } from "@/lib/analytics/events";
import { resolveFunnelStage } from "@/lib/analytics/funnel";
import { getEventCategory, resolveCanonicalEventName } from "@/lib/analytics/taxonomy";

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const GA4_API_SECRET = process.env.GA4_API_SECRET?.trim();

const BLOCKED_PROP_KEYS = new Set([
  "email",
  "name",
  "full_name",
  "phone",
  "address",
  "password",
  "token",
  "secret",
  "api_key",
  "organization_id",
  "workspace_id",
  "user_id",
  "session_id",
  "client_id",
  "customer_id",
  "subscription_id",
  "invoice_id",
  "prompt",
  "completion",
]);

function sanitizeServerProps(props?: AnalyticsEventProps): AnalyticsEventProps | undefined {
  if (!props) return undefined;

  const safe: AnalyticsEventProps = {};

  for (const [key, value] of Object.entries(props)) {
    const normalized = key.trim().toLowerCase().replace(/-/g, "_");
    if (BLOCKED_PROP_KEYS.has(normalized)) continue;
    if (normalized.includes("password") || normalized.includes("secret") || normalized.includes("api_key")) {
      continue;
    }
    if (typeof value === "string" && (value.includes("@") || value.length > 120)) continue;
    safe[key] = value;
  }

  return Object.keys(safe).length > 0 ? safe : undefined;
}

/**
 * Fire a server-side conversion to GA4 Measurement Protocol — optional, fail-silent.
 * Integration point for billing lifecycle / server conversions (see billing-lifecycle.ts).
 * Never include organization, customer, or secret identifiers.
 */
export async function trackServerAnalyticsEvent(
  name: string,
  props?: AnalyticsEventProps,
): Promise<void> {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) return;

  const canonicalName = resolveCanonicalEventName(name);
  const category = getEventCategory(canonicalName);
  const funnelStage = resolveFunnelStage(canonicalName);
  const safeProps = sanitizeServerProps({
    ...props,
    event_category: category,
    ...(funnelStage ? { funnel_stage: funnelStage } : {}),
  });
  const clientId = `server.${Date.now()}`;

  const payload = {
    client_id: clientId,
    events: [
      {
        name: canonicalName,
        params: {
          engagement_time_msec: "1",
          ...safeProps,
        },
      },
    ],
  };

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
  } catch {
    // Server analytics must never break webhooks or actions.
  }
}
